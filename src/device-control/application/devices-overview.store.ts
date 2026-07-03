import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';
import { DevicesOverview } from '../domain/model/devices-overview.entity';
import { SmartDevice } from '../domain/model/smart-device.entity';
import { createDefaultDeviceDetail, DeviceDetail } from '../domain/model/device-detail.entity';
import { DevicesOverviewApiService } from '../infrastructure/devices-overview-api.service';
import { DeviceDetailApiService } from '../infrastructure/device-detail-api.service';

export type NewDeviceType = 'climate' | 'generic';

@Injectable({ providedIn: 'root' })
export class DevicesOverviewStore {
  private readonly api = inject(DevicesOverviewApiService);
  private readonly detailApi = inject(DeviceDetailApiService);

  readonly overview = signal<DevicesOverview | null>(null);
  readonly loading = signal(false);
  readonly activeSceneId = signal<string | null>(null);

  readonly featuredRoom = computed(() =>
    this.overview()?.rooms.find(room => room.layout === 'featured') ?? null,
  );

  readonly compactRooms = computed(() =>
    this.overview()?.rooms.filter(room => room.layout === 'compact') ?? [],
  );

  readonly suiteRoom = computed(() =>
    this.overview()?.rooms.find(room => room.layout === 'suite') ?? null,
  );

  loadOverview(): Observable<DevicesOverview> {
    this.loading.set(true);
    return this.api.getOverview().pipe(
      tap({
        next: data => this.overview.set(data),
        error: () => undefined,
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  refreshOverview(): Observable<DevicesOverview> {
    return this.loadOverview();
  }

  turnOnAll(): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => ({
      ...room,
      devices: room.devices.map(device => {
        if (device.connection === 'offline') return device;
        return {
          ...device,
          active: true,
          powerUsageW: this.resolvePowerUsage(device, true),
          statusLabel: `Online • ${this.resolvePowerUsage(device, true)}W`,
        };
      }),
      totalPowerW: room.layout === 'featured' ? undefined : room.totalPowerW,
      activeDeviceCount:
        room.layout === 'featured'
          ? room.devices.filter(device => device.connection === 'online').length
          : room.activeDeviceCount,
    }));

    const roomsWithPower = rooms.map(room => {
      if (room.layout !== 'featured') return room;
      return {
        ...room,
        totalPowerW: this.sumRoomPower(room.devices),
      };
    });

    const updated = { ...current, rooms: roomsWithPower };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  applyEcoMode(): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => ({
      ...room,
      devices: room.devices.map(device => {
        if (device.connection === 'offline' || device.isPriority) return device;
        const isHighConsumer = (device.powerUsageW ?? 0) >= 500 || device.icon === 'acUnit' || device.icon === 'oven';
        if (!device.active || !isHighConsumer) return device;
        return { ...device, active: false, powerUsageW: 0, statusLabel: 'Online • 0W' };
      }),
      totalPowerW:
        room.layout === 'featured'
          ? this.sumRoomPower(
              room.devices.map(device => {
                if (device.connection === 'offline' || device.isPriority) return device;
                const isHighConsumer =
                  (device.powerUsageW ?? 0) >= 500 || device.icon === 'acUnit' || device.icon === 'oven';
                if (!device.active || !isHighConsumer) return device;
                return { ...device, active: false, powerUsageW: 0 };
              }),
            )
          : room.totalPowerW,
      activeDeviceCount:
        room.layout === 'featured'
          ? room.devices.filter(device => device.active && device.connection === 'online').length
          : room.activeDeviceCount,
    }));

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  toggleDevicePriority(roomId: string, deviceId: string): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.map(device =>
          device.id === deviceId ? { ...device, isPriority: !device.isPriority } : device,
        ),
      };
    });

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  setDeviceCategory(
    roomId: string,
    deviceId: string,
    usageCategory: SmartDevice['usageCategory'],
  ): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.map(device =>
          device.id === deviceId ? { ...device, usageCategory } : device,
        ),
      };
    });

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  private saveOverview(overview: DevicesOverview): void {
    this.api.saveOverview(overview).subscribe({
      next: data => this.overview.set(data),
    });
  }

  toggleDevice(roomId: string, deviceId: string): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;

      const devices = room.devices.map(device => {
        if (device.id !== deviceId) return device;
        if (device.connection === 'offline') return device;

        const active = !device.active;
        return {
          ...device,
          active,
          powerUsageW: this.resolvePowerUsage(device, active),
        };
      });

      return {
        ...room,
        devices,
        totalPowerW: room.layout === 'featured' ? this.sumRoomPower(devices) : room.totalPowerW,
        activeDeviceCount:
          room.layout === 'featured'
            ? devices.filter(device => device.active && device.connection === 'online').length
            : room.activeDeviceCount,
      };
    });

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);

    this.detailApi.getById(deviceId).subscribe({
      next: detail => {
        const active = !detail.active;
        this.detailApi
          .update({
            ...detail,
            active,
            powerLoadKw: active ? detail.powerLoadKw || 1.4 : 0,
          })
          .subscribe();
      },
      error: () => undefined,
    });
  }

  activateScene(sceneId: string): void {
    const current = this.overview();
    if (!current) return;

    this.activeSceneId.set(sceneId);

    const turnOffLiving = sceneId === 'good-night';
    const turnOnMorning = sceneId === 'morning';

    const rooms = current.rooms.map(room => ({
      ...room,
      devices: room.devices.map(device => {
        if (device.connection === 'offline') return device;

        if (turnOffLiving && room.id === 'living-room') {
          return { ...device, active: false, powerUsageW: 0 };
        }

        if (turnOnMorning && room.id === 'living-room' && device.icon === 'lightbulb') {
          return { ...device, active: true, powerUsageW: 45 };
        }

        if (turnOnMorning && room.id === 'kitchen' && device.id === 'coffee-machine') {
          return { ...device, active: true, powerUsageW: 850, statusLabel: 'Online • 850W' };
        }

        return device;
      }),
      totalPowerW:
        room.id === 'living-room'
          ? this.sumRoomPower(
              room.devices.map(device => {
                if (device.connection === 'offline') return device;
                if (turnOffLiving) return { ...device, active: false, powerUsageW: 0 };
                if (turnOnMorning && device.icon === 'lightbulb') {
                  return { ...device, active: true, powerUsageW: 45 };
                }
                return device;
              }),
            )
          : room.totalPowerW,
    }));

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  addDevice(
    roomId: string,
    name: string,
    deviceType: NewDeviceType = 'generic',
  ): Observable<DeviceDetail> {
    const current = this.overview();
    if (!current || !name.trim()) {
      throw new Error('Invalid device');
    }

    const room = current.rooms.find(r => r.id === roomId);
    const roomName = room?.name ?? roomId;
    const id = `custom-${Date.now()}`;
    const icon = deviceType === 'climate' ? 'acUnit' : 'moreHoriz';

    const newDevice: SmartDevice = {
      id,
      name: name.trim(),
      icon,
      connection: 'online',
      active: deviceType === 'climate',
      powerUsageW: deviceType === 'climate' ? 1200 : 0,
      statusLabel: deviceType === 'climate' ? 'Online • 1200W' : 'Online • 0W',
    };

    const rooms = current.rooms.map(r => {
      if (r.id !== roomId) return r;
      return { ...r, devices: [...r.devices, newDevice] };
    });

    const updatedOverview = {
      ...current,
      totalDevices: current.totalDevices + 1,
      rooms,
    };

    this.overview.set(updatedOverview);
    this.saveOverview(updatedOverview);

    const detail = createDefaultDeviceDetail(
      id,
      roomId,
      roomName,
      name.trim(),
      icon,
      deviceType,
    );

    if (deviceType === 'climate') {
      detail.active = true;
      detail.powerLoadKw = 1.4;
      detail.alerts = [
        {
          id: 'peak',
          type: 'peak',
          title: 'Peak Hour Alert',
          message: 'Utility rates increase in 2 hours. Consider pre-cooling now.',
        },
      ];
    }

    return this.detailApi.create(detail);
  }

  removeDevice(roomId: string, deviceId: string): Observable<void> {
    const current = this.overview();
    if (!current) {
      throw new Error('No overview loaded');
    }

    const rooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.filter(device => device.id !== deviceId),
        totalPowerW:
          room.layout === 'featured'
            ? this.sumRoomPower(room.devices.filter(device => device.id !== deviceId))
            : room.totalPowerW,
        activeDeviceCount:
          room.layout === 'featured'
            ? room.devices
                .filter(device => device.id !== deviceId)
                .filter(device => device.active && device.connection === 'online').length
            : room.activeDeviceCount,
      };
    });

    const updated = {
      ...current,
      totalDevices: Math.max(0, current.totalDevices - 1),
      rooms,
    };

    this.overview.set(updated);
    this.saveOverview(updated);

    return this.detailApi.delete(deviceId).pipe(
      tap(() => undefined),
    );
  }

  getRoomName(roomId: string): string {
    return this.overview()?.rooms.find(room => room.id === roomId)?.name ?? roomId;
  }

  syncDeviceState(roomId: string, deviceId: string, active: boolean, powerUsageW: number | null): void {
    const current = this.overview();
    if (!current) return;

    const rooms = current.rooms.map(room => {
      if (room.id !== roomId) return room;

      const devices = room.devices.map(device => {
        if (device.id !== deviceId) return device;
        return { ...device, active, powerUsageW };
      });

      return {
        ...room,
        devices,
        totalPowerW: room.layout === 'featured' ? this.sumRoomPower(devices) : room.totalPowerW,
        activeDeviceCount:
          room.layout === 'featured'
            ? devices.filter(device => device.active && device.connection === 'online').length
            : room.activeDeviceCount,
      };
    });

    const updated = { ...current, rooms };
    this.overview.set(updated);
    this.saveOverview(updated);
  }

  private sumRoomPower(devices: SmartDevice[]): number {
    return devices.reduce((sum, device) => sum + (device.powerUsageW ?? 0), 0);
  }

  private resolvePowerUsage(device: SmartDevice, active: boolean): number | null {
    if (!active) return 0;
    if (device.powerUsageW === null) return null;

    const defaults: Record<string, number> = {
      lightbulb: 45,
      acUnit: 1200,
      tv: 180,
      plug: 25,
      coffee: 850,
      oven: 1500,
      airPurifier: 35,
      speaker: 12,
    };

    return device.powerUsageW || defaults[device.icon] || 20;
  }
}
