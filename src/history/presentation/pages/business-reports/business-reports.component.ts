import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessReportsStore } from '../../../application/business-reports.store';
import { ConsumptionDataPoint } from '../../../domain/model/consumption-data-point.entity';
import {
  DeviceReportResponse,
  DeviceReportStatus,
  DeviceReportTrend,
  ReportsChartPeriod,
  ReportsPeriod,
} from '../../../infrastructure/business-reports-response';
import { BusinessReportsNavComponent } from '../../components/business-reports-nav/business-reports-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { APP_CURRENT_YEAR } from '../../../../shared/constants/app.constants';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { downloadCsvFile, downloadExcelFile, downloadTextFile } from '../../../../shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

interface ChartCoordinate {
  x: number;
  y: number;
}

const DEVICE_MENU_WIDTH = 188;
const DEVICE_MENU_HEIGHT = 132;

@Component({
  selector: 'app-business-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule, BusinessReportsNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './business-reports.component.html',
  styleUrls: ['./business-reports.component.css', '../../styles/reports-animations.css'],
})
export class BusinessReportsComponent implements OnInit {
  readonly store = inject(BusinessReportsStore);
  readonly icons = GOOGLE_ICONS;
  readonly currentYear = APP_CURRENT_YEAR;

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly chartBaseY = 220;

  readonly periodOptions: ReportsPeriod[] = ['thisMonth', 'lastMonth', 'thisQuarter'];
  readonly deviceMenuAnchor = signal<DOMRect | null>(null);

  readonly activeDeviceMenu = computed(() => {
    const deviceId = this.store.openDeviceMenuId();
    const report = this.store.report();
    if (!deviceId || !report) return null;
    return report.devices.find(device => device.id === deviceId) ?? null;
  });

  readonly deviceMenuStyle = computed(() => {
    const rect = this.deviceMenuAnchor();
    if (!rect) return null;

    const viewportPadding = 12;
    let top = rect.bottom + 6;
    let left = rect.right - DEVICE_MENU_WIDTH;

    if (top + DEVICE_MENU_HEIGHT > window.innerHeight - viewportPadding) {
      top = rect.top - DEVICE_MENU_HEIGHT - 6;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + DEVICE_MENU_WIDTH > window.innerWidth - viewportPadding) {
      left = window.innerWidth - DEVICE_MENU_WIDTH - viewportPadding;
    }

    return {
      top: `${Math.max(viewportPadding, top)}px`,
      left: `${left}px`,
    };
  });

  ngOnInit(): void {
    this.store.load();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.period-picker')) {
      this.store.closePeriodMenu();
    }
    if (!target?.closest('.device-actions-trigger') && !target?.closest('.device-actions-flyout')) {
      this.closeDeviceMenu();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.closeDeviceMenu();
  }

  setChartPeriod(period: ReportsChartPeriod): void {
    this.store.setChartPeriod(period);
  }

  zoneWidth(usageKwh: number): number {
    return (usageKwh / this.store.maxZoneUsage()) * 100;
  }

  getDeviceIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  trendIcon(trend: DeviceReportTrend): string {
    if (trend === 'up') return this.icons.trendingUp;
    if (trend === 'down') return this.icons.trendingDown;
    return this.icons.moreHoriz;
  }

  trendClass(trend: DeviceReportTrend): string {
    return `trend trend--${trend}`;
  }

  statusClass(status: DeviceReportStatus): string {
    return status === 'OPTIMAL' ? 'status-pill status-pill--optimal' : 'status-pill status-pill--steady';
  }

  statusKey(status: DeviceReportStatus): string {
    return status === 'OPTIMAL' ? 'businessReports.status.optimal' : 'businessReports.status.steady';
  }

  onExportPdf(): void {
    const report = this.store.report();
    if (!report) return;

    const period = this.translate.instant(this.store.periodLabelKey());
    const lines = [
      this.translate.instant('businessReports.title'),
      `${this.translate.instant('businessReports.selectPeriod')}: ${period}`,
      '',
      `${this.translate.instant('businessReports.efficiencyGoal')}: ${report.efficiencyGoalPercent}%`,
      '',
      this.translate.instant('businessReports.zoneComparison'),
      ...report.zones.map(zone => `- ${zone.name}: ${zone.usageKwh} kWh`),
      '',
      this.translate.instant('businessReports.deviceReports'),
      ...report.devices.map(device => `- ${device.name} | ${device.zone} | ${device.consumptionKwh} kWh`),
    ];

    downloadTextFile(`domoticore-reports-${this.store.selectedPeriod()}.txt`, lines.join('\n'));
    this.feedback.showToast(this.translate.instant('businessReports.toast.exportPdf'), 'success');
  }

  onExportCsv(): void {
    const report = this.store.report();
    if (!report) return;

    const rows: string[][] = [
      [
        this.translate.instant('businessReports.table.deviceName'),
        this.translate.instant('businessReports.table.zone'),
        this.translate.instant('businessReports.table.consumption'),
        this.translate.instant('businessReports.table.trend'),
        this.translate.instant('businessReports.table.status'),
      ],
      ...report.devices.map(device => [
        device.name,
        device.zone,
        `${device.consumptionKwh}`,
        `${device.trend === 'stable' ? '0.0' : (device.trend === 'up' ? '+' : '-') + device.trendPercent}%`,
        device.status,
      ]),
    ];

    downloadCsvFile(`domoticore-reports-${this.store.selectedPeriod()}.csv`, rows);
    this.feedback.showToast(this.translate.instant('businessReports.toast.exportCsv'), 'success');
  }

  onExportExcel(): void {
    const report = this.store.report();
    if (!report) return;

    const rows: string[][] = [
      [
        this.translate.instant('businessReports.table.deviceName'),
        this.translate.instant('businessReports.table.zone'),
        this.translate.instant('businessReports.table.consumption'),
        this.translate.instant('businessReports.table.trend'),
        this.translate.instant('businessReports.table.status'),
      ],
      ...report.devices.map(device => [
        device.name,
        device.zone,
        `${device.consumptionKwh}`,
        `${device.trend === 'stable' ? '0.0' : (device.trend === 'up' ? '+' : '-') + device.trendPercent}%`,
        device.status,
      ]),
    ];

    downloadExcelFile(`domoticore-reports-${this.store.selectedPeriod()}`, rows);
    this.feedback.showToast(this.translate.instant('businessReports.toast.exportExcel'), 'success');
  }

  onSelectPeriod(event: Event): void {
    event.stopPropagation();
    this.store.togglePeriodMenu();
  }

  onPickPeriod(period: ReportsPeriod, event: Event): void {
    event.stopPropagation();
    this.store.setPeriod(period);
    this.store.closePeriodMenu();
    this.feedback.showToast(
      this.translate.instant('businessReports.toast.periodSelected', {
        period: this.translate.instant(`businessReports.period.${period}`),
      }),
      'info',
    );
  }

  onApplyStrategy(): void {
    if (this.store.strategyApplied()) {
      this.feedback.showToast(this.translate.instant('businessReports.toast.strategyAlreadyApplied'), 'info');
      return;
    }

    this.store.applyPeakStrategy();
    this.feedback.showToast(this.translate.instant('businessReports.toast.strategyApplied'), 'success');
  }

  onViewAllDevices(): void {
    this.router.navigate(['/app/devices']);
  }

  onToggleDeviceMenu(device: DeviceReportResponse, event: Event): void {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const opened = this.store.toggleDeviceMenu(device.id);

    if (opened) {
      this.deviceMenuAnchor.set(button.getBoundingClientRect());
      return;
    }

    this.deviceMenuAnchor.set(null);
  }

  closeDeviceMenu(): void {
    this.store.closeDeviceMenu();
    this.deviceMenuAnchor.set(null);
  }

  onViewDevice(device: DeviceReportResponse): void {
    this.closeDeviceMenu();
    this.router.navigate(['/app/devices']);
    this.feedback.showToast(
      this.translate.instant('businessReports.toast.viewingDevice', { device: device.name }),
      'info',
    );
  }

  onExportDeviceRow(device: DeviceReportResponse): void {
    this.closeDeviceMenu();
    downloadCsvFile(`device-${device.id}.csv`, [
      ['Device', 'Zone', 'Consumption', 'Trend', 'Status'],
      [
        device.name,
        device.zone,
        `${device.consumptionKwh}`,
        `${device.trendPercent}%`,
        device.status,
      ],
    ]);
    this.feedback.showToast(
      this.translate.instant('businessReports.toast.deviceExported', { device: device.name }),
      'success',
    );
  }

  onToggleDeviceStatus(device: DeviceReportResponse): void {
    this.store.toggleDeviceStatus(device.id);
    this.feedback.showToast(
      this.translate.instant('businessReports.toast.deviceStatusUpdated', { device: device.name }),
      'success',
    );
  }

  getChartCoordinates(points: ConsumptionDataPoint[]): ChartCoordinate[] {
    const max = this.getMaxValue(points);
    return points.map((point, index) => ({
      x: this.getPointX(index, points.length),
      y: this.getPointY(point.value, max),
    }));
  }

  getSmoothLinePath(points: ConsumptionDataPoint[]): string {
    const coords = this.getChartCoordinates(points);
    if (!coords.length) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

    let path = `M ${coords[0].x} ${coords[0].y}`;

    for (let index = 0; index < coords.length - 1; index++) {
      const previous = coords[index - 1] ?? coords[index];
      const current = coords[index];
      const next = coords[index + 1];
      const afterNext = coords[index + 2] ?? next;

      const control1X = current.x + (next.x - previous.x) / 6;
      const control1Y = current.y + (next.y - previous.y) / 6;
      const control2X = next.x - (afterNext.x - current.x) / 6;
      const control2Y = next.y - (afterNext.y - current.y) / 6;

      path += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
    }

    return path;
  }

  getSmoothAreaPath(points: ConsumptionDataPoint[]): string {
    const coords = this.getChartCoordinates(points);
    if (!coords.length) return '';

    const linePath = this.getSmoothLinePath(points);
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;

    return `${linePath} L ${lastX} ${this.chartBaseY} L ${firstX} ${this.chartBaseY} Z`;
  }

  getPointX(index: number, total: number): number {
    if (total <= 1) return 40;
    const padding = 40;
    const width = 560;
    return padding + (index / (total - 1)) * width;
  }

  getPointY(value: number, max: number): number {
    const paddingTop = 30;
    const chartHeight = 190;
    const normalized = value / max;
    return paddingTop + chartHeight - normalized * chartHeight;
  }

  getMaxValue(points: ConsumptionDataPoint[]): number {
    return Math.max(...points.map(point => point.value), 1);
  }
}
