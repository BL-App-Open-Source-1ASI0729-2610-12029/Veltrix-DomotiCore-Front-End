import { Injectable, computed, inject, signal } from '@angular/core';
import { HistoryApiService } from '../infrastructure/history-api.service';
import {
  BusinessReportsResponse,
  DeviceReportStatus,
  ReportsChartPeriod,
  ReportsPeriod,
} from '../infrastructure/business-reports-response';

@Injectable({ providedIn: 'root' })
export class BusinessReportsStore {
  private readonly api = inject(HistoryApiService);

  readonly report = signal<BusinessReportsResponse | null>(null);
  readonly chartPeriod = signal<ReportsChartPeriod>('weekly');
  readonly selectedPeriod = signal<ReportsPeriod>('thisMonth');
  readonly loading = signal(false);
  readonly showPeriodMenu = signal(false);
  readonly chartAnimKey = signal(0);
  readonly strategyApplied = signal(false);
  readonly openDeviceMenuId = signal<string | null>(null);

  readonly chartPoints = computed(() => {
    const data = this.report();
    if (!data) return [];
    return this.chartPeriod() === 'weekly' ? data.weeklyChart : data.monthlyChart;
  });

  readonly maxZoneUsage = computed(() => {
    const zones = this.report()?.zones ?? [];
    return zones.reduce((max, zone) => Math.max(max, zone.usageKwh), 1);
  });

  readonly periodLabelKey = computed(() => `businessReports.period.${this.selectedPeriod()}`);

  load(period?: ReportsPeriod): void {
    const nextPeriod = period ?? this.selectedPeriod();
    this.selectedPeriod.set(nextPeriod);
    this.loading.set(true);

    this.api.getBusinessReports(nextPeriod).subscribe({
      next: data => {
        this.report.set(data);
        this.chartAnimKey.update(key => key + 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setChartPeriod(period: ReportsChartPeriod): void {
    this.chartPeriod.set(period);
    this.chartAnimKey.update(key => key + 1);
  }

  setPeriod(period: ReportsPeriod): void {
    this.load(period);
  }

  togglePeriodMenu(): void {
    this.showPeriodMenu.update(open => !open);
  }

  closePeriodMenu(): void {
    this.showPeriodMenu.set(false);
  }

  applyPeakStrategy(): void {
    this.strategyApplied.set(true);
    this.report.update(data => {
      if (!data) return data;
      return {
        ...data,
        peakAlert: {
          ...data.peakAlert,
          messageKey: 'businessReports.peak.messageApplied',
        },
      };
    });
  }

  openDeviceMenu(deviceId: string): void {
    this.openDeviceMenuId.set(deviceId);
  }

  toggleDeviceMenu(deviceId: string): boolean {
    if (this.openDeviceMenuId() === deviceId) {
      this.closeDeviceMenu();
      return false;
    }
    this.openDeviceMenu(deviceId);
    return true;
  }

  closeDeviceMenu(): void {
    this.openDeviceMenuId.set(null);
  }

  toggleDeviceStatus(deviceId: string): void {
    this.report.update(data => {
      if (!data) return data;
      return {
        ...data,
        devices: data.devices.map(device => {
          if (device.id !== deviceId) return device;
          const nextStatus: DeviceReportStatus = device.status === 'OPTIMAL' ? 'STEADY' : 'OPTIMAL';
          return { ...device, status: nextStatus };
        }),
      };
    });
    this.closeDeviceMenu();
  }
}
