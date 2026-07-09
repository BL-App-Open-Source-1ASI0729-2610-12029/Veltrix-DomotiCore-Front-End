import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HistoryStore } from '../../../application/history.store';
import { ConsumptionDataPoint } from '../../../domain/model/consumption-data-point.entity';
import { EnergyPeriod } from '../../../domain/model/energy-period.entity';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../app/shared/constants/google-icons';
import { HistoryNavComponent } from '../../components/history-nav/history-nav.component';
import { Router } from '@angular/router';
import { UiFeedbackService } from '../../../../app/shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../app/shared/material';

interface ChartCoordinate {
  x: number;
  y: number;
}

@Component({
  selector: 'app-energy-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, HistoryNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './energy-intelligence.component.html',
  styleUrls: ['./energy-intelligence.component.css', '../../styles/reports-animations.css'],
})
export class EnergyIntelligenceComponent implements OnInit {
  readonly store = inject(HistoryStore);
  readonly icons = GOOGLE_ICONS;
  private readonly router = inject(Router);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  readonly periods: EnergyPeriod[] = ['day', 'week', 'month'];
  readonly showAddModal = signal(false);
  readonly addSuccess = signal(false);

  newDeviceName = '';
  newDeviceKwh: number | null = null;

  private readonly chartBaseY = 220;

  ngOnInit(): void {
    this.store.loadEnergyIntelligence();
  }

  onToggleAutoOptimization(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.store.toggleAutoOptimization(enabled);
    const key = enabled ? 'history.autoOptimization.enabled' : 'history.autoOptimization.disabled';
    this.feedback.showToast(this.translate.instant(key), 'success');
  }

  anomalyClass(severity: 'low' | 'medium' | 'high'): string {
    return `anomaly-card anomaly-card--${severity}`;
  }

  selectPeriod(period: EnergyPeriod): void {
    this.store.setPeriod(period);
  }

  getDeviceIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
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

  getBarHeight(value: number, bars: number[]): number {
    const max = Math.max(...bars, 1);
    return (value / max) * 100;
  }

  getMaxValue(points: ConsumptionDataPoint[]): number {
    return Math.max(...points.map(point => point.value), 1);
  }

  getPeakIndex(points: ConsumptionDataPoint[]): number {
    if (!points.length) return 0;
    let peakIndex = 0;
    points.forEach((point, index) => {
      if (point.value > points[peakIndex].value) peakIndex = index;
    });
    return peakIndex;
  }

  onViewDetailedReport(): void {
    this.feedback.showToast(this.translate.instant('history.toast.openingDetailedReport'), 'info');
    this.router.navigate(['/app/history/activity']);
  }

  openAddModal(): void {
    this.newDeviceName = '';
    this.newDeviceKwh = null;
    this.addSuccess.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  submitAddDevice(): void {
    if (!this.newDeviceName.trim() || !this.newDeviceKwh || this.newDeviceKwh <= 0) return;

    this.store.addDevice(this.newDeviceName, this.newDeviceKwh);
    this.addSuccess.set(true);

    setTimeout(() => {
      this.closeAddModal();
      this.addSuccess.set(false);
    }, 900);
  }
}
