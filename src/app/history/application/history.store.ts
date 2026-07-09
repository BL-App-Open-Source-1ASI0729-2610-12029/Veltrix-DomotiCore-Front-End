import { Injectable, inject, signal } from '@angular/core';
import { DeviceConsumption } from '../domain/model/device-consumption.entity';
import { ActivityStreamEntry } from '../domain/model/activity-stream.entity';
import { EnergyIntelligence } from '../domain/model/energy-intelligence.entity';
import { EnergyPeriod } from '../domain/model/energy-period.entity';
import { ActivityStreamStore } from './activity-stream.store';
import { HistoryApiService } from '../infrastructure/history-api.service';
import { AutomationApiService } from '../../automation/infrastructure/automation-api.service';

@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly api = inject(HistoryApiService);
  private readonly automationApi = inject(AutomationApiService);
  private readonly activityStore = inject(ActivityStreamStore);

  readonly selectedPeriod = signal<EnergyPeriod>('week');
  readonly energyIntelligence = signal<EnergyIntelligence | null>(null);
  readonly loading = signal(false);
  readonly autoOptimizationEnabled = signal(false);

  loadEnergyIntelligence(): void {
    const period = this.selectedPeriod();
    this.loading.set(true);

    this.automationApi.getHomePreferences().subscribe(prefs => {
      this.autoOptimizationEnabled.set(prefs.autoOptimizationEnabled);
    });

    this.api.getEnergyIntelligence(period).subscribe({
      next: data => {
        this.energyIntelligence.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setPeriod(period: EnergyPeriod): void {
    this.selectedPeriod.set(period);
    this.loadEnergyIntelligence();
  }

  addDevice(name: string, consumptionKwh: number): void {
    const current = this.energyIntelligence();
    if (!current || !name.trim() || consumptionKwh <= 0) return;

    const newDevice: DeviceConsumption = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      consumptionKwh,
      sharePercent: 0,
      icon: 'moreHoriz',
    };

    const devices = [...current.devices, newDevice];
    const totalKwh = devices.reduce((sum, device) => sum + device.consumptionKwh, 0);

    const updatedDevices = devices.map(device => ({
      ...device,
      sharePercent: Math.round((device.consumptionKwh / totalKwh) * 100),
    }));

    const highest = updatedDevices.reduce(
      (top, device) => (device.consumptionKwh > top.consumptionKwh ? device : top),
      updatedDevices[0],
    );

    this.energyIntelligence.set({
      ...current,
      devices: updatedDevices,
      totalConsumptionKwh: +totalKwh.toFixed(1),
      highestConsumer: {
        name: highest.name,
        consumptionKwh: highest.consumptionKwh,
        sharePercent: highest.sharePercent,
        icon: highest.icon,
      },
    });

    const activityEntry: ActivityStreamEntry = {
      id: `activity-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      deviceName: newDevice.name,
      deviceModel: 'Consumption Tracker',
      deviceIcon: newDevice.icon,
      deviceType: 'appliance',
      action: 'consumption_update',
      actionLabel: 'Consumption Updated',
      location: 'Whole Home',
      status: 'success',
      consumptionKwh: newDevice.consumptionKwh,
    };

    this.activityStore.addEntry(activityEntry);
  }

  toggleAutoOptimization(enabled: boolean): void {
    this.autoOptimizationEnabled.set(enabled);
    this.automationApi.patchHomePreferences({ autoOptimizationEnabled: enabled }).subscribe();
  }
}
