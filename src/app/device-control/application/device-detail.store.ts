import { Injectable, inject, signal } from '@angular/core';
import { DeviceDetail, createDefaultDeviceDetail } from '../domain/model/device-detail.entity';
import { DeviceDetailApiService } from '../infrastructure/device-detail-api.service';
import { OperationMode, PowerChartPeriod, FAN_SPEED_OPTIONS, SWING_OPTIONS } from '../infrastructure/device-detail-response';
import { DevicesOverviewStore } from './devices-overview.store';

@Injectable({ providedIn: 'root' })
export class DeviceDetailStore {
  private readonly api = inject(DeviceDetailApiService);
  private readonly overviewStore = inject(DevicesOverviewStore);

  readonly detail = signal<DeviceDetail | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  private realtimeIntervalId: ReturnType<typeof setInterval> | null = null;

  loadDetail(deviceId: string, roomId?: string): void {
    this.loading.set(true);
    this.api.getById(deviceId).subscribe({
      next: data => {
        this.detail.set(data);
        this.loading.set(false);
      },
      error: () => this.createDetailFromOverview(deviceId, roomId),
    });
  }

  private createDetailFromOverview(deviceId: string, roomId?: string): void {
    const overview = this.overviewStore.overview();
    if (!overview) {
      this.loading.set(false);
      return;
    }

    const room = overview.rooms.find(r => r.id === roomId || r.devices.some(d => d.id === deviceId));
    const device = room?.devices.find(d => d.id === deviceId);

    if (!room || !device) {
      this.loading.set(false);
      return;
    }

    const deviceType =
      device.usageCategory === 'lighting' || device.icon === 'lightbulb'
        ? 'lighting'
        : device.icon === 'acUnit' || device.icon === 'thermostat'
          ? 'climate'
          : 'generic';

    const detail = createDefaultDeviceDetail(
      deviceId,
      room.id,
      room.name,
      device.name,
      device.icon,
      deviceType,
    );
    detail.active = device.active;
    detail.connection = device.connection;
    detail.powerLoadKw = device.active ? (device.powerUsageW ?? 0) / 1000 : 0;
    detail.batteryPercent = device.batteryPercent ?? null;
    detail.lastStateAt = new Date().toISOString();
    detail.lastStateLabel = device.active ? 'On' : 'Off';

    this.api.create(detail).subscribe({
      next: data => {
        this.detail.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private persist(detail: DeviceDetail): void {
    this.saving.set(true);
    this.api.update(detail).subscribe({
      next: data => {
        this.detail.set(data);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  adjustBrightness(value: number): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'lighting' || !current.active) return;

    const brightnessPercent = Math.min(100, Math.max(0, Math.round(value)));
    const powerLoadKw = this.estimatePowerLoad({ ...current, brightnessPercent });
    const updated: DeviceDetail = {
      ...current,
      brightnessPercent,
      powerLoadKw,
      powerChartPoints: this.updateChartTail(current.powerChartPoints, powerLoadKw),
      lastStateAt: new Date().toISOString(),
      lastStateLabel: `Warm white ${brightnessPercent}%`,
    };
    this.detail.set(updated);
    this.persist(updated);
    this.overviewStore.syncDeviceState(
      updated.roomId,
      updated.id,
      updated.active,
      Math.round(updated.powerLoadKw * 1000),
    );
  }

  togglePower(): void {
    const current = this.detail();
    if (!current || current.connection === 'offline') return;

    const active = !current.active;
    const powerLoadKw = active ? this.estimatePowerLoad(current) : 0;
    const updated: DeviceDetail = {
      ...current,
      active,
      powerLoadKw,
      powerChartPoints: this.updateChartTail(current.powerChartPoints, powerLoadKw),
      lastStateAt: new Date().toISOString(),
      lastStateLabel: active ? 'On' : 'Off',
    };
    this.detail.set(updated);
    this.persist(updated);
    this.overviewStore.syncDeviceState(
      updated.roomId,
      updated.id,
      updated.active,
      updated.active ? Math.round(updated.powerLoadKw * 1000) : 0,
    );
  }

  adjustTargetTemp(delta: number): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'climate' || !current.active) return;

    const targetTempC = Math.min(30, Math.max(16, current.targetTempC + delta));
    const currentTempC = this.simulateCurrentTemp(current.currentTempC, targetTempC, current.operationMode);
    const updated = {
      ...current,
      targetTempC,
      currentTempC,
      powerLoadKw: this.estimatePowerLoad({ ...current, targetTempC }),
      powerChartPoints: this.updateChartTail(
        current.powerChartPoints,
        this.estimatePowerLoad({ ...current, targetTempC }),
      ),
    };
    this.detail.set(updated);
    this.persist(updated);
  }

  setOperationMode(mode: OperationMode): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'climate') return;

    const updated = {
      ...current,
      operationMode: mode,
      powerLoadKw: current.active ? this.estimatePowerLoad({ ...current, operationMode: mode }) : 0,
    };
    if (current.active) {
      updated.powerChartPoints = this.updateChartTail(updated.powerChartPoints, updated.powerLoadKw);
    }
    this.detail.set(updated);
    this.persist(updated);
  }

  toggleEcoMode(): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'climate') return;

    const ecoMode = !current.ecoMode;
    const updated = {
      ...current,
      ecoMode,
      powerLoadKw: current.active ? this.estimatePowerLoad({ ...current, ecoMode }) : 0,
    };
    if (current.active) {
      updated.powerChartPoints = this.updateChartTail(updated.powerChartPoints, updated.powerLoadKw);
    }
    this.detail.set(updated);
    this.persist(updated);
  }

  cycleFanSpeed(): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'climate') return;

    const options = [...FAN_SPEED_OPTIONS];
    const index = options.indexOf(current.fanSpeed as (typeof options)[number]);
    const nextIndex = index >= 0 ? (index + 1) % options.length : 0;
    const updated = {
      ...current,
      fanSpeed: options[nextIndex],
      powerLoadKw: current.active ? this.estimatePowerLoad({ ...current, fanSpeed: options[nextIndex] }) : 0,
    };
    if (current.active) {
      updated.powerChartPoints = this.updateChartTail(updated.powerChartPoints, updated.powerLoadKw);
    }
    this.detail.set(updated);
    this.persist(updated);
  }

  cycleSwing(): void {
    const current = this.detail();
    if (!current || current.deviceType !== 'climate') return;

    const options = [...SWING_OPTIONS];
    const index = options.indexOf(current.swing as (typeof options)[number]);
    const nextIndex = index >= 0 ? (index + 1) % options.length : 0;
    const updated = { ...current, swing: options[nextIndex] };
    this.detail.set(updated);
    this.persist(updated);
  }

  setScheduledTimer(time: string | null): void {
    const current = this.detail();
    if (!current) return;

    const updated = { ...current, scheduledTimer: time };
    this.detail.set(updated);
    this.persist(updated);
  }

  dismissAlert(alertId: string): void {
    const current = this.detail();
    if (!current) return;

    const updated = {
      ...current,
      alerts: current.alerts.filter(alert => alert.id !== alertId),
    };
    this.detail.set(updated);
    this.persist(updated);
  }

  setPowerChartPeriod(period: PowerChartPeriod): void {
    const current = this.detail();
    if (!current) return;

    const chartByPeriod: Record<PowerChartPeriod, { label: string; value: number }[]> = {
      realtime: [
        { label: '14:00', value: 0.8 },
        { label: '15:00', value: 1.0 },
        { label: '16:00', value: 1.2 },
        { label: '17:00', value: 1.3 },
        { label: 'NOW', value: current.powerLoadKw },
      ],
      day: [
        { label: '06:00', value: 0.2 },
        { label: '10:00', value: 0.9 },
        { label: '14:00', value: 1.4 },
        { label: '18:00', value: 1.1 },
        { label: 'NOW', value: current.powerLoadKw },
      ],
      month: [
        { label: 'W1', value: 28 },
        { label: 'W2', value: 32 },
        { label: 'W3', value: 30 },
        { label: 'W4', value: 35 },
        { label: 'NOW', value: 31 },
      ],
    };

    const updated = {
      ...current,
      powerChartPeriod: period,
      powerChartPoints: chartByPeriod[period],
    };
    this.detail.set(updated);
    this.persist(updated);

    if (period === 'realtime') {
      this.startRealtimeUpdates();
    } else {
      this.stopRealtimeUpdates();
    }
  }

  renameDevice(name: string): void {
    const current = this.detail();
    const trimmed = name.trim();
    if (!current || !trimmed) return;

    const updated = { ...current, name: trimmed };
    this.detail.set(updated);
    this.persist(updated);
    this.overviewStore.renameDevice(current.roomId, current.id, trimmed);
  }

  startRealtimeUpdates(): void {
    this.stopRealtimeUpdates();
    this.realtimeIntervalId = setInterval(() => {
      const current = this.detail();
      if (!current || current.powerChartPeriod !== 'realtime') return;

      const jitter = current.active
        ? Math.max(0.1, current.powerLoadKw + (Math.random() - 0.5) * 0.15)
        : 0;
      const rounded = Math.round(jitter * 100) / 100;
      const updated = {
        ...current,
        powerLoadKw: rounded,
        powerChartPoints: this.updateChartTail(current.powerChartPoints, rounded),
      };
      this.detail.set(updated);
    }, 3000);
  }

  stopRealtimeUpdates(): void {
    if (this.realtimeIntervalId) {
      clearInterval(this.realtimeIntervalId);
      this.realtimeIntervalId = null;
    }
  }

  createDetail(
    id: string,
    roomId: string,
    roomName: string,
    name: string,
    icon: string,
    deviceType: 'climate' | 'generic',
  ) {
    return createDefaultDeviceDetail(id, roomId, roomName, name, icon, deviceType);
  }

  saveNewDetail(detail: DeviceDetail) {
    return this.api.create(detail);
  }

  deleteDetail(deviceId: string) {
    return this.api.delete(deviceId);
  }

  private updateChartTail(
    points: { label: string; value: number }[],
    value: number,
  ): { label: string; value: number }[] {
    if (!points.length) return [{ label: 'NOW', value }];
    return points.map((point, index) =>
      index === points.length - 1 ? { ...point, value } : point,
    );
  }

  private estimatePowerLoad(detail: DeviceDetail): number {
    if (!detail.active) {
      return 0;
    }

    if (detail.deviceType === 'lighting') {
      const brightness = detail.brightnessPercent ?? 80;
      return Math.round((brightness / 100) * 0.06 * 1000) / 1000;
    }

    if (detail.deviceType !== 'climate') {
      return 0.3;
    }

    const modeBase: Record<OperationMode, number> = {
      cool: 1.4,
      heat: 1.6,
      fan: 0.45,
    };

    const fanMultiplier: Record<string, number> = {
      Low: 0.75,
      Medium: 0.9,
      High: 1.05,
      Auto: 0.95,
      'Auto High': 1.1,
    };

    const tempDelta = Math.abs(detail.targetTempC - detail.currentTempC);
    const load =
      modeBase[detail.operationMode] *
      (fanMultiplier[detail.fanSpeed] ?? 1) *
      (detail.ecoMode ? 0.72 : 1) *
      (1 + tempDelta * 0.04);

    return Math.round(Math.min(load, 2.2) * 100) / 100;
  }

  private simulateCurrentTemp(current: number, target: number, mode: OperationMode): number {
    if (mode === 'fan') return current;

    const direction = target > current ? 1 : -1;
    const next = current + direction * 0.3;
    if (direction > 0) return Math.min(next, target);
    return Math.max(next, target);
  }
}
