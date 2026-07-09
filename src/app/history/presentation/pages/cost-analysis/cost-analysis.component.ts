import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditFilterKey, CostAnalysisStore } from '../../../application/cost-analysis.store';
import { BillingBarResponse, RoiUpgradeStatus } from '../../../infrastructure/cost-analysis-response';
import { BusinessReportsNavComponent } from '../../components/business-reports-nav/business-reports-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { downloadExcelFile, downloadTextFile } from '../../../../shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-cost-analysis',
  standalone: true,
  imports: [CommonModule, TranslateModule, BusinessReportsNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './cost-analysis.component.html',
  styleUrls: ['./cost-analysis.component.css', '../../styles/reports-animations.css'],
})
export class CostAnalysisComponent implements OnInit {
  readonly store = inject(CostAnalysisStore);
  readonly icons = GOOGLE_ICONS;

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  readonly auditFilterOptions: AuditFilterKey[] = ['last6Months', 'last12Months', 'yearToDate'];

  readonly chartViewWidth = 640;
  readonly chartViewHeight = 280;
  readonly hoveredBarIndex = signal<number | null>(null);

  readonly chartPad = { top: 28, right: 20, bottom: 48, left: 58 };

  ngOnInit(): void {
    this.store.load();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.store.closeAuditFilterMenu();
  }

  formatCurrency(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatCompactCurrency(value: number): string {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  getMaxBillingAmount(bars: BillingBarResponse[]): number {
    const maxAmount = Math.max(...bars.map(bar => bar.amount), 1);
    const step = 2000;
    return Math.ceil(maxAmount / step) * step;
  }

  getBillingAverage(bars: BillingBarResponse[]): number {
    return bars.reduce((sum, bar) => sum + bar.amount, 0) / bars.length;
  }

  getYAxisTicks(max: number): number[] {
    const step = max <= 12000 ? 2000 : 5000;
    const ticks: number[] = [];
    for (let value = step; value <= max; value += step) {
      ticks.push(value);
    }
    return ticks;
  }

  formatAxisLabel(value: number): string {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }
    return `$${value}`;
  }

  getBarLayout(index: number, total: number): { x: number; width: number } {
    const gap = 14;
    const innerWidth = this.chartViewWidth - this.chartPad.left - this.chartPad.right;
    const width = (innerWidth - gap * (total - 1)) / total;
    const x = this.chartPad.left + index * (width + gap);
    return { x, width };
  }

  private get chartInnerHeight(): number {
    return this.chartViewHeight - this.chartPad.top - this.chartPad.bottom;
  }

  getBarYBottom(): number {
    return this.chartPad.top + this.chartInnerHeight;
  }

  getBarTotalHeight(amount: number, max: number): number {
    return (amount / max) * this.chartInnerHeight;
  }

  getBarPeakHeight(bar: BillingBarResponse, max: number): number {
    return (bar.peakAmount / max) * this.chartInnerHeight;
  }

  getBarBaseHeight(bar: BillingBarResponse, max: number): number {
    return this.getBarTotalHeight(bar.amount, max) - this.getBarPeakHeight(bar, max);
  }

  getYForAmount(amount: number, max: number): number {
    return this.getBarYBottom() - this.getBarTotalHeight(amount, max);
  }

  getAverageLineY(bars: BillingBarResponse[], max: number): number {
    return this.getYForAmount(this.getBillingAverage(bars), max);
  }

  getTrendLinePath(bars: BillingBarResponse[], max: number): string {
    if (!bars.length) return '';

    const points = bars.map((bar, index) => {
      const { x, width } = this.getBarLayout(index, bars.length);
      return {
        x: x + width / 2,
        y: this.getYForAmount(bar.amount, max) - 8,
      };
    });

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index++) {
      const current = points[index];
      const next = points[index + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  }

  getTooltipX(index: number, total: number): number {
    const { x, width } = this.getBarLayout(index, total);
    const tooltipWidth = 128;
    let left = x + width / 2 - tooltipWidth / 2;
    const minLeft = this.chartPad.left;
    const maxLeft = this.chartViewWidth - this.chartPad.right - tooltipWidth;
    return Math.min(Math.max(left, minLeft), maxLeft);
  }

  onBarEnter(index: number): void {
    this.hoveredBarIndex.set(index);
  }

  onBarLeave(): void {
    this.hoveredBarIndex.set(null);
  }

  areaIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.factory;
  }

  roiStatusClass(status: RoiUpgradeStatus): string {
    return status === 'approved' ? 'roi-badge roi-badge--approved' : 'roi-badge roi-badge--review';
  }

  roiStatusKey(status: RoiUpgradeStatus): string {
    return status === 'approved' ? 'costAnalysis.roi.statusApproved' : 'costAnalysis.roi.statusReview';
  }

  onExportPdf(): void {
    const data = this.store.data();
    if (!data) return;

    const lines = [
      this.translate.instant('costAnalysis.title'),
      `${this.translate.instant('costAnalysis.billingCycle')}: ${data.billingCycleLabel}`,
      `${this.translate.instant('costAnalysis.totalBilling')}: ${this.formatCurrency(data.totalBilling)}`,
      `${this.translate.instant('costAnalysis.peak.title')}: ${this.formatCurrency(data.peakSurcharge)}`,
      '',
      this.translate.instant('costAnalysis.audit.title'),
      ...this.store.filteredBillingAudit().map(row =>
        `${row.period} | ${this.formatCurrency(row.netAmount)} | ${this.formatNumber(row.baseUsageKwh)} kWh`,
      ),
    ];

    downloadTextFile('domoticore-cost-analysis.txt', lines.join('\n'));
    this.feedback.showToast(this.translate.instant('costAnalysis.toast.exportPdf'), 'success');
  }

  onExportExcel(): void {
    const rows: string[][] = [
      [
        this.translate.instant('costAnalysis.audit.columns.period'),
        this.translate.instant('costAnalysis.audit.columns.netAmount'),
        this.translate.instant('costAnalysis.audit.columns.status'),
      ],
      ...this.store.filteredBillingAudit().map(row => [
        row.period,
        this.formatCurrency(row.netAmount),
        row.status,
      ]),
    ];

    downloadExcelFile('domoticore-cost-analysis', rows);
    this.feedback.showToast(this.translate.instant('costAnalysis.toast.exportExcel'), 'success');
  }

  onRecalculateRoi(): void {
    if (this.store.roiRecalculating()) return;

    this.store.recalculateRoi();
    this.feedback.showToast(this.translate.instant('costAnalysis.toast.recalculateRoi'), 'success');
  }

  onToggleAuditFilter(event: Event): void {
    event.stopPropagation();
    this.store.toggleAuditFilterMenu();
  }

  onPickAuditFilter(filterKey: AuditFilterKey, event: Event): void {
    event.stopPropagation();
    this.store.setAuditFilter(filterKey);
    this.feedback.showToast(
      this.translate.instant('costAnalysis.toast.filterSelected', {
        filter: this.translate.instant(`costAnalysis.audit.filters.${filterKey}`),
      }),
      'info',
    );
  }
}
