import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeviceDetailStore } from '../../../application/device-detail.store';
import { DevicesOverviewStore } from '../../../application/devices-overview.store';
import { MaintenanceStore } from '../../../application/maintenance.store';
import { OperationMode, PowerChartPeriod } from '../../../infrastructure/device-detail-response';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

interface ChartPoint {
  label: string;
  value: number;
  x: number;
  y: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './device-detail.component.html',
  styleUrl: './device-detail.component.css',
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly store = inject(DeviceDetailStore);
  readonly overviewStore = inject(DevicesOverviewStore);
  readonly maintenanceStore = inject(MaintenanceStore);
  readonly icons = GOOGLE_ICONS;
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  readonly showTimerModal = signal(false);
  readonly showMaintenanceModal = signal(false);
  readonly showRenameModal = signal(false);
  readonly renameValue = signal('');
  readonly hoveredChartIndex = signal<number | null>(null);
  timerHour = 22;
  timerMinute = 0;
  maintenanceAlertId: string | null = null;
  maintenanceDate = '';

  readonly chartPeriods: PowerChartPeriod[] = ['realtime', 'day', 'month'];
  readonly operationModes: OperationMode[] = ['cool', 'heat', 'fan'];

  roomId = '';
  deviceId = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    this.deviceId = this.route.snapshot.paramMap.get('deviceId') ?? '';
    this.overviewStore.loadOverview().subscribe(() => {
      this.store.loadDetail(this.deviceId, this.roomId);
      this.store.startRealtimeUpdates();
    });
  }

  ngOnDestroy(): void {
    this.store.stopRealtimeUpdates();
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  getModeIcon(mode: OperationMode): string {
    const map: Record<OperationMode, string> = {
      cool: GOOGLE_ICONS.acUnit,
      heat: GOOGLE_ICONS.lightMode,
      fan: GOOGLE_ICONS.airPurifier,
    };
    return map[mode];
  }

  getModeAccent(mode: OperationMode): string {
    const map: Record<OperationMode, string> = {
      cool: '#2949c7',
      heat: '#ea580c',
      fan: '#0d9488',
    };
    return map[mode];
  }

  getTempRingProgress(target: number): number {
    return ((target - 16) / (30 - 16)) * 100;
  }

  getTempDelta(current: number, target: number): string {
    const delta = Math.round((target - current) * 10) / 10;
    if (delta === 0) return '±0°';
    return delta > 0 ? `+${delta}°` : `${delta}°`;
  }

  getChartPoints(points: ChartPoint[] | { label: string; value: number }[]): ChartPoint[] {
    if (!points.length) return [];

    const width = 560;
    const height = 160;
    const padding = 24;
    const max = Math.max(...points.map(p => p.value), 0.1);

    return points.map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (point.value / max) * (height - padding * 2);
      return { label: point.label, value: point.value, x, y };
    });
  }

  getChartLinePath(points: { label: string; value: number }[]): string {
    const coords = this.getChartPoints(points);
    if (!coords.length) return '';
    return `M ${coords.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }

  getChartAreaPath(points: { label: string; value: number }[]): string {
    const line = this.getChartLinePath(points);
    if (!line) return '';

    const width = 560;
    const height = 160;
    const padding = 24;
    const lastX = padding + (width - padding * 2);

    return `${line} L ${lastX},${height - padding} L ${padding},${height - padding} Z`;
  }

  getChartGridLines(): number[] {
    return [0.25, 0.5, 0.75];
  }

  getChartMaxValue(points: { label: string; value: number }[]): number {
    return Math.max(...points.map(p => p.value), 0.1);
  }

  formatChartValue(value: number, period: PowerChartPeriod): string {
    if (period === 'month') return `${value} kWh`;
    return `${value} kW`;
  }

  goBack(): void {
    this.router.navigate(['/app/devices']);
  }

  onDelete(): void {
    if (!this.feedback.confirmAction(this.translate.instant('deviceDetail.confirmDelete'))) return;

    this.overviewStore.removeDevice(this.roomId, this.deviceId).subscribe({
      next: () => this.router.navigate(['/app/devices']),
    });
  }

  openRenameModal(): void {
    const detail = this.store.detail();
    if (!detail) return;
    this.renameValue.set(detail.name);
    this.showRenameModal.set(true);
  }

  closeRenameModal(): void {
    this.showRenameModal.set(false);
  }

  submitRename(): void {
    const name = this.renameValue().trim();
    if (!name) return;
    this.store.renameDevice(name);
    this.closeRenameModal();
    this.feedback.showToast(this.translate.instant('deviceDetail.toast.renamed', { name }), 'success');
  }

  formatLastState(detail: { lastStateAt?: string; lastStateLabel?: string }): string {
    if (!detail.lastStateAt) return this.translate.instant('deviceDetail.lastStateUnknown');
    const when = new Date(detail.lastStateAt).toLocaleString();
    const label = detail.lastStateLabel ?? this.translate.instant('deviceDetail.standby');
    return this.translate.instant('deviceDetail.lastState', { label, when });
  }

  selectPeriod(period: PowerChartPeriod): void {
    this.store.setPowerChartPeriod(period);
    this.hoveredChartIndex.set(null);
  }

  openTimerModal(): void {
    const detail = this.store.detail();
    if (detail?.scheduledTimer) {
      const [hour, minute] = detail.scheduledTimer.split(':').map(Number);
      this.timerHour = hour;
      this.timerMinute = minute;
    }
    this.showTimerModal.set(true);
  }

  closeTimerModal(): void {
    this.showTimerModal.set(false);
  }

  submitTimer(): void {
    const hour = Math.min(23, Math.max(0, this.timerHour || 0));
    const minute = Math.min(59, Math.max(0, this.timerMinute || 0));
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    this.store.setScheduledTimer(time);
    this.closeTimerModal();
    this.feedback.showToast(this.translate.instant('deviceDetail.toast.timerSet', { time }), 'success');
  }

  clearTimer(): void {
    this.store.setScheduledTimer(null);
    this.closeTimerModal();
    this.feedback.showToast(this.translate.instant('deviceDetail.toast.timerCleared'), 'info');
  }

  cycleFanSpeed(): void {
    this.store.cycleFanSpeed();
    const speed = this.store.detail()?.fanSpeed;
    if (speed) {
      this.feedback.showToast(
        this.translate.instant('deviceDetail.toast.fanSpeedSet', { speed }),
        'success',
      );
    }
  }

  cycleSwing(): void {
    this.store.cycleSwing();
    const swing = this.store.detail()?.swing;
    if (swing) {
      this.feedback.showToast(
        this.translate.instant('deviceDetail.toast.swingSet', { swing }),
        'success',
      );
    }
  }

  dismissAlert(alertId: string): void {
    this.store.dismissAlert(alertId);
    this.feedback.showToast(this.translate.instant('deviceDetail.toast.alertDismissed'), 'info');
  }

  handleAlertAction(alertId: string, type: 'peak' | 'maintenance'): void {
    if (type === 'peak') {
      this.store.toggleEcoMode();
      this.feedback.showToast(this.translate.instant('deviceDetail.toast.ecoEnabled'), 'success');
      return;
    }

    this.maintenanceAlertId = alertId;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.maintenanceDate = nextWeek.toISOString().slice(0, 10);
    this.showMaintenanceModal.set(true);
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceModal.set(false);
    this.maintenanceAlertId = null;
  }

  confirmMaintenanceSchedule(): void {
    if (!this.maintenanceAlertId || !this.maintenanceDate) return;

    const detail = this.store.detail();
    if (detail) {
      this.maintenanceStore.register({
        deviceId: detail.id,
        deviceName: detail.name,
        performedAt: new Date(this.maintenanceDate).toISOString(),
        description: this.translate.instant('deviceDetail.maintenanceModal.scheduledNote'),
      });
    }

    this.dismissAlert(this.maintenanceAlertId);
    this.closeMaintenanceModal();
    this.feedback.showToast(
      this.translate.instant('deviceDetail.toast.maintenanceScheduled', { date: this.maintenanceDate }),
      'success',
    );
  }

  setHoveredChartIndex(index: number | null): void {
    this.hoveredChartIndex.set(index);
  }

  formatTimerPreview(): string {
    const hour = Math.min(23, Math.max(0, this.timerHour || 0));
    const minute = Math.min(59, Math.max(0, this.timerMinute || 0));
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
}
