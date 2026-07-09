import { Injectable, signal } from '@angular/core';

import { GOOGLE_ICONS } from '../../shared/constants/google-icons';
import { AlertEntity } from '../domain/model/alert.entity';
import { DeviceEntity } from '../domain/model/device.entity';
import { StatisticEntity } from '../domain/model/statistic.entity';

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
      nameKey: 'dashboard.devices.livingRoomAc.name',
      statusKey: 'dashboard.devices.livingRoomAc.status',
      active: true,
      icon: GOOGLE_ICONS.acUnit,
      live: false
    },
    {
      nameKey: 'dashboard.devices.kitchenLights.name',
      statusKey: 'dashboard.devices.kitchenLights.status',
      active: false,
      icon: GOOGLE_ICONS.lightbulb,
      live: false
    },
    {
      nameKey: 'dashboard.devices.frontPorchCam.name',
      statusKey: 'dashboard.devices.frontPorchCam.status',
      active: true,
      icon: GOOGLE_ICONS.videocam,
      live: true
    },
    {
      nameKey: 'dashboard.devices.garageDoor.name',
      statusKey: 'dashboard.devices.garageDoor.status',
      active: true,
      icon: GOOGLE_ICONS.door,
      live: false
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
    this.currentEnergyData.set(this.energyData()[range]);
  }

}
