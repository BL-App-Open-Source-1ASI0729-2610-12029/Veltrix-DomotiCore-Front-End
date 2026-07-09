import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FacilityZone,
  SmeAlert,
  SmeDateRange,
  SmeDeviceStatus,
  SmeOperationsHubStore,
} from '../../../application/sme-operations-hub.store';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import {
  FacilityInteractiveMapComponent,
  FacilityMapMarker,
} from '../../../../shared/components/facility-interactive-map/facility-interactive-map.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { downloadJsonFile } from '../../../../shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-operations-hub',
  standalone: true,
  imports: [CommonModule, TranslateModule, FacilityInteractiveMapComponent, ...MATERIAL_IMPORTS],
  templateUrl: './operations-hub.component.html',
  styleUrls: ['./operations-hub.component.css'],
})
export class OperationsHubComponent {
  readonly icons = GOOGLE_ICONS;

  private readonly store = inject(SmeOperationsHubStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly kpis = this.store.kpis;
  readonly loadBars = this.store.loadBars;
  readonly alerts = this.store.alerts;
  readonly deviceStatuses = this.store.deviceStatuses;
  readonly facilityZones = this.store.facilityZones;
  readonly sustainabilityScore = this.store.sustainabilityScore;
  readonly criticalAlertCount = this.store.criticalAlertCount;
  readonly selectedRange = this.store.selectedRange;
  readonly dataRefreshing = this.store.dataRefreshing;

  showDateMenu = false;
  exportingAudit = false;

  readonly dateRangeLabel = computed(() => {
    const key =
      this.selectedRange() === 'thisMonth'
        ? 'smeHub.dateRange.thisMonth'
        : this.selectedRange() === 'lastMonth'
          ? 'smeHub.dateRange.lastMonth'
          : 'smeHub.dateRange.thisQuarter';
    return this.translate.instant(key);
  });

  readonly maxBarTotal = computed(() => {
    const bars = this.loadBars();
    return Math.max(...bars.map(b => b.hvac + b.lighting + b.servers), 1);
  });

  readonly facilityMapMarkers = computed((): FacilityMapMarker[] =>
    this.facilityZones().map(zone => ({
      id: zone.id,
      x: zone.x,
      y: zone.y,
      variant: zone.variant === 'alert' ? 'alert' : 'normal',
      label: this.translate.instant(zone.nameKey),
    })),
  );

  onSelectRange(range: SmeDateRange): void {
    this.showDateMenu = false;
    const changed = this.store.setDateRange(range);
    if (changed) {
      this.feedback.showToast(this.translate.instant('smeHub.toast.rangeUpdated'), 'success');
    }
  }

  onExportAudit(): void {
    if (this.exportingAudit) return;

    this.exportingAudit = true;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`domoticore-audit-${stamp}.json`, this.store.buildAuditExport());

    window.setTimeout(() => {
      this.exportingAudit = false;
      this.feedback.showToast(this.translate.instant('smeHub.toast.exportReady'), 'success');
    }, 500);
  }

  onViewAllLogs(): void {
    this.router.navigate(['/app/reports/alerts-history']);
    this.feedback.showToast(this.translate.instant('smeHub.toast.openingLogs'), 'info');
  }

  onAlertClick(alert: SmeAlert): void {
    this.router.navigate(['/app/reports/alerts-history'], {
      queryParams: alert.critical ? { tab: 'alerts' } : { tab: 'all' },
    });
  }

  onSolarIntegration(): void {
    this.router.navigate(['/app/reports/cost-analysis']);
    this.feedback.showToast(this.translate.instant('smeHub.toast.solarDetails'), 'info');
  }

  onDeviceClick(device: SmeDeviceStatus): void {
    this.navigateTarget(device.route, device.queryParams);
    this.feedback.showToast(
      this.translate.instant('smeHub.toast.openingDevice', {
        name: this.translate.instant(device.nameKey),
      }),
      'info',
    );
  }

  onZoneClick(zone: FacilityZone): void {
    this.navigateTarget(zone.route, zone.queryParams);
    this.feedback.showToast(
      this.translate.instant('smeHub.toast.openingZone', {
        name: this.translate.instant(zone.nameKey),
      }),
      'info',
    );
  }

  onFacilityMarkerClick(zoneId: string): void {
    const zone = this.facilityZones().find(item => item.id === zoneId);
    if (zone) {
      this.onZoneClick(zone);
    }
  }

  barHeight(value: number): number {
    return Math.round((value / this.maxBarTotal()) * 100);
  }

  donutOffset(percent: number): number {
    const circumference = 2 * Math.PI * 42;
    return circumference - (percent / 100) * circumference;
  }

  private navigateTarget(route: string[], queryParams?: Record<string, string>): void {
    this.router.navigate(route, queryParams ? { queryParams } : undefined);
  }
}
