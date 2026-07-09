import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { GOOGLE_ICONS, GoogleIconKey } from '../../shared/constants/google-icons';
import { AlertEntity } from '../domain/model/alert.entity';
import { DeviceEntity } from '../domain/model/device.entity';
import { StatisticEntity } from '../domain/model/statistic.entity';
import { DashboardApiService } from '../infrastructure/dashboard-api.service';
import { DeviceDetailApiService } from '../../device-control/infrastructure/device-detail-api.service';
import { DeviceBulkControlApiService } from '../../device-control/infrastructure/device-bulk-control-api.service';
import { createDefaultDeviceDetail } from '../../device-control/domain/model/device-detail.entity';

export interface EnergyDataPoint {
  time: string;
  value: number;
  status: 'low' | 'normal' | 'peak';
  label?: string;
  date?: string;
  details?: string;
}

export interface EnergyData {
  range: string;
  titleKey: string;
  descriptionKey: string;
  unit: string;
  peak: number;
  average: number;
  total: number;
  dataPoints: EnergyDataPoint[];
  trends: {
    comparisonKey: string;
    insightKey: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStore {
  private readonly api = inject(DashboardApiService);
  private readonly detailApi = inject(DeviceDetailApiService);
  private readonly bulkApi = inject(DeviceBulkControlApiService);

  readonly loading = signal(false);

  statistics = signal<StatisticEntity[]>([
    {
      titleKey: 'dashboard.stats.currentPower.title',
      value: '1.2 kW',
      descriptionKey: 'dashboard.stats.currentPower.description',
      icon: GOOGLE_ICONS.power
    },
    {
      titleKey: 'dashboard.stats.activeDevices.title',
      value: '8 / 12',
      descriptionKey: 'dashboard.stats.activeDevices.description',
      icon: GOOGLE_ICONS.signal
    },
    {
      titleKey: 'dashboard.stats.monthlySavings.title',
      value: '$15.40',
      descriptionKey: 'dashboard.stats.monthlySavings.description',
      icon: GOOGLE_ICONS.savings
    }
  ]);

  alerts = signal<AlertEntity[]>([
    {
      typeKey: 'dashboard.alerts.highConsumption.type',
      titleKey: 'dashboard.alerts.highConsumption.title',
      descriptionKey: 'dashboard.alerts.highConsumption.description',
      timeKey: 'dashboard.alerts.highConsumption.time',
      danger: true
    },
    {
      typeKey: 'dashboard.alerts.maintenance.type',
      titleKey: 'dashboard.alerts.maintenance.title',
      descriptionKey: 'dashboard.alerts.maintenance.description',
      timeKey: 'dashboard.alerts.maintenance.time',
      danger: false
    },
    {
      typeKey: 'dashboard.alerts.info.type',
      titleKey: 'dashboard.alerts.info.title',
      descriptionKey: 'dashboard.alerts.info.description',
      timeKey: 'dashboard.alerts.info.time',
      danger: false
    }
  ]);

  devices = signal<DeviceEntity[]>([
    {
      id: 'living-room-ac',
      nameKey: 'dashboard.devices.livingRoomAc.name',
      statusKey: 'dashboard.devices.livingRoomAc.status',
      active: true,
      icon: GOOGLE_ICONS.acUnit,
      live: false,
      usageCategory: 'climate',
    },
    {
      id: 'kitchen-lights',
      nameKey: 'dashboard.devices.kitchenLights.name',
      statusKey: 'dashboard.devices.kitchenLights.status',
      active: false,
      icon: GOOGLE_ICONS.lightbulb,
      live: false,
      usageCategory: 'lighting',
    },
    {
      id: 'front-porch-cam',
      nameKey: 'dashboard.devices.frontPorchCam.name',
      statusKey: 'dashboard.devices.frontPorchCam.status',
      active: true,
      icon: GOOGLE_ICONS.videocam,
      live: true,
      usageCategory: 'security',
    },
    {
      id: 'garage-door',
      nameKey: 'dashboard.devices.garageDoor.name',
      statusKey: 'dashboard.devices.garageDoor.status',
      active: true,
      icon: GOOGLE_ICONS.door,
      live: false,
      usageCategory: 'security',
    }
  ]);

  energyData = signal<{[key: string]: EnergyData}>({
    '24h': {
      range: '24h',
      titleKey: 'dashboard.energy.24h.title',
      descriptionKey: 'dashboard.energy.24h.description',
      unit: 'kW',
      peak: 1.8,
      average: 1.2,
      total: 28.8,
      dataPoints: [
        { time: '12 PM', value: 1.2, status: 'normal', details: 'Moderate consumption' },
        { time: '1 PM', value: 1.4, status: 'normal', details: 'Afternoon usage' },
        { time: '2 PM', value: 1.8, status: 'peak', label: '1.8 kW (Peak)', details: 'Peak usage detected' },
        { time: '3 PM', value: 1.5, status: 'normal', details: 'Returned to normal' },
        { time: '4 PM', value: 1.3, status: 'normal', details: 'Afternoon level' },
        { time: '5 PM', value: 1.6, status: 'normal', details: 'Evening start' },
        { time: '6 PM', value: 1.7, status: 'normal', details: 'Increased usage' },
        { time: '7 PM', value: 1.5, status: 'normal', details: 'Moderate level' },
        { time: '8 PM', value: 1.4, status: 'normal', details: 'Evening standard' },
        { time: '9 PM', value: 1.2, status: 'low', details: 'Reduced consumption' },
        { time: '10 PM', value: 0.9, status: 'low', details: 'Night-time low' },
        { time: '11 PM', value: 0.8, status: 'low', details: 'Minimal usage' }
      ],
      trends: {
        comparisonKey: 'dashboard.energy.24h.comparison',
        insightKey: 'dashboard.energy.24h.insight'
      }
    },
    '7d': {
      range: '7d',
      titleKey: 'dashboard.energy.7d.title',
      descriptionKey: 'dashboard.energy.7d.description',
      unit: 'kW',
      peak: 2.1,
      average: 1.35,
      total: 227.2,
      dataPoints: [
        { time: 'Monday', value: 1.2, status: 'normal', date: '2026-06-01', details: 'Normal week start' },
        { time: 'Tuesday', value: 1.4, status: 'normal', date: '2026-06-02', details: 'Slight increase' },
        { time: 'Wednesday', value: 1.6, status: 'normal', date: '2026-06-03', details: 'Mid-week usage' },
        { time: 'Thursday', value: 1.8, status: 'peak', date: '2026-06-04', label: '1.8 kW', details: 'Peak week day' },
        { time: 'Friday', value: 1.5, status: 'normal', date: '2026-06-05', details: 'Week end start' },
        { time: 'Saturday', value: 1.3, status: 'normal', date: '2026-06-06', details: 'Weekend low' },
        { time: 'Sunday', value: 1.1, status: 'low', date: '2026-06-07', details: 'Minimal usage' }
      ],
      trends: {
        comparisonKey: 'dashboard.energy.7d.comparison',
        insightKey: 'dashboard.energy.7d.insight'
      }
    },
    '30d': {
      range: '30d',
      titleKey: 'dashboard.energy.30d.title',
      descriptionKey: 'dashboard.energy.30d.description',
      unit: 'kW',
      peak: 2.5,
      average: 1.42,
      total: 1022.4,
      dataPoints: [
        { time: 'Week 1', value: 1.1, status: 'low', details: 'May 1-7: Low usage' },
        { time: 'Week 2', value: 1.3, status: 'normal', details: 'May 8-14: Normal' },
        { time: 'Week 3', value: 1.5, status: 'normal', details: 'May 15-21: Moderate' },
        { time: 'Week 4', value: 1.7, status: 'normal', details: 'May 22-28: High' },
        { time: 'Week 5', value: 1.8, status: 'peak', label: '1.8 kW', details: 'May 29-Jun 4: Peak week' },
        { time: 'Week 6', value: 1.2, status: 'normal', details: 'Jun 5-7: Normalized' }
      ],
      trends: {
        comparisonKey: 'dashboard.energy.30d.comparison',
        insightKey: 'dashboard.energy.30d.insight'
      }
    }
  });

  currentEnergyRange = signal<string>('24h');
  currentEnergyData = signal<EnergyData>(this.energyData()[this.currentEnergyRange()]);

  setEnergyRange(range: string) {
    this.currentEnergyRange.set(range);
    const data = this.energyData()[range];
    if (data) {
      this.currentEnergyData.set(data);
    }
  }

  load(): Observable<void> {
    this.loading.set(true);
    return this.api.getDashboard().pipe(
      tap(response => {
        if (response.statistics?.length) {
          this.statistics.set(response.statistics.map(stat => ({
            ...stat,
            icon: this.resolveIcon(stat.icon),
          })));
        }
        if (response.alerts) {
          this.alerts.set(response.alerts);
        }
        if (response.devices?.length) {
          this.devices.set(response.devices.map(device => ({
            ...device,
            icon: this.resolveIcon(device.icon),
          })));
        }
        if (response.energyData && Object.keys(response.energyData).length > 0) {
          this.energyData.set(response.energyData);
          this.setEnergyRange(this.currentEnergyRange());
        }
      }),
      map(() => undefined),
      finalize(() => this.loading.set(false)),
    );
  }

  private resolveIcon(icon: string): string {
    if (!icon) {
      return GOOGLE_ICONS.deviceHub;
    }
    if (icon.startsWith('http')) {
      return icon;
    }
    return GOOGLE_ICONS[icon as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  toggleDevice(device: DeviceEntity): Observable<void> {
    if (!device.id || !this.bulkApi.hasApi()) {
      device.active = !device.active;
      this.devices.set([...this.devices()]);
      return this.reload();
    }

    return this.detailApi.getById(device.id).pipe(
      switchMap(detail =>
        this.detailApi.update({
          ...detail,
          active: !detail.active,
          powerLoadKw: !detail.active ? detail.powerLoadKw || 1.0 : 0,
        }),
      ),
      switchMap(() => this.reload()),
      map(() => undefined),
    );
  }

  turnAllOn(): Observable<string[]> {
    if (!this.bulkApi.hasApi()) {
      const failed: string[] = [];
      this.devices.update(items =>
        items.map(device => {
          if (!device.live && !device.active) {
            failed.push(device.name ?? device.id ?? 'device');
            return device;
          }
          return { ...device, active: true };
        }),
      );
      return this.reload().pipe(map(() => failed));
    }

    return this.bulkApi.bulkToggle('on').pipe(
      switchMap(result => this.reload().pipe(map(() => result.failed?.map(item => item.name ?? item.id) ?? []))),
    );
  }

  shutdownLiveDevice(): Observable<void> {
    const devices = this.devices();
    const target = devices.find(device => device.live) ?? devices.find(device => device.active);
    if (!target?.id || !this.bulkApi.hasApi()) {
      if (target) {
        target.active = false;
        target.live = false;
        this.devices.set([...devices]);
      }
      return this.reload().pipe(map(() => undefined));
    }

    return this.detailApi.getById(target.id).pipe(
      switchMap(detail =>
        this.detailApi.update({
          ...detail,
          active: false,
          powerLoadKw: 0,
          connection: 'offline',
        }),
      ),
      switchMap(() => this.reload()),
      map(() => undefined),
    );
  }

  addDevice(name: string, deviceType: string): Observable<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return this.reload();
    }

    if (!this.bulkApi.hasApi()) {
      const iconMap: Record<string, string> = {
        climate: 'acUnit',
        lights: 'lightbulb',
        security: 'videocam',
        generic: 'deviceHub',
      };
      const newDevice: DeviceEntity = {
        name: trimmed,
        statusKey: 'dashboard.devices.readyAdded',
        active: true,
        icon: this.resolveIcon(iconMap[deviceType] ?? 'deviceHub'),
        live: false,
      };
      this.devices.set([...this.devices(), newDevice]);
      return this.reload();
    }

    const id = `dashboard-${Date.now()}`;
    const icon = deviceType === 'climate' ? 'acUnit' : deviceType === 'lights' ? 'lightbulb' : 'moreHoriz';
    const detail = createDefaultDeviceDetail(id, 'living-room', 'Living Room', trimmed, icon, deviceType === 'climate' ? 'climate' : 'generic');
    if (deviceType === 'climate') {
      detail.active = true;
      detail.powerLoadKw = 1.2;
    }

    return this.detailApi.create(detail).pipe(
      switchMap(() => this.reload()),
      map(() => undefined),
    );
  }

  private reload(): Observable<void> {
    return this.load();
  }

}
