import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardStore, EnergyDataPoint } from '../../../application/dashboard.store';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { DeviceEntity } from '../../../domain/model/device.entity';
import { AlertEntity } from '../../../domain/model/alert.entity';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', '../../../../history/presentation/styles/reports-animations.css']
})
export class DashboardComponent {

  readonly icons = GOOGLE_ICONS;

  private dashboardStore = inject(DashboardStore);
  private router = inject(Router);
  private feedback = inject(UiFeedbackService);
  private translate = inject(TranslateService);

  statistics = this.dashboardStore.statistics;
  alerts = this.dashboardStore.alerts;
  devices = this.dashboardStore.devices;
  currentEnergyData = this.dashboardStore.currentEnergyData;

  hoveredPoint = signal<EnergyDataPoint | null>(null);
  tooltipPosition = signal<{x: number, y: number}>({x: 0, y: 0});

  selectedDevice = signal<DeviceEntity | null>(null);
  selectedAlert = signal<AlertEntity | null>(null);
  selectedTimeRange = signal<string>('24h');
  chartRenderKey = signal(0);
  deviceFilter = signal<'all' | 'online' | 'offline'>('all');

  showDeviceModal = signal(false);
  showAddDeviceModal = signal(false);
  showEnergySaverModal = signal(false);
  showAlertModal = signal(false);
  shutdownPending = signal(false);

  newDeviceName = '';
  newDeviceType = 'climate';

  filteredDevices = computed(() => {
    const filter = this.deviceFilter();
    const all = this.devices();
    if (filter === 'online') return all.filter(device => device.active);
    if (filter === 'offline') return all.filter(device => !device.active);
    return all;
  });

  deviceLabel(device: DeviceEntity): string {
    return device.name ?? this.translate.instant(device.nameKey ?? '');
  }

  deviceStatus(device: DeviceEntity): string {
    return device.status ?? this.translate.instant(device.statusKey ?? '');
  }

  onShutdownDevice() {
    if (this.shutdownPending()) return;
    this.shutdownPending.set(true);
    this.feedback.showToast(this.translate.instant('dashboard.toast.shutdownInitiated'), 'warning');

    const devices = this.devices();
    const target = devices.find(device => device.live) ?? devices.find(device => device.active);
    if (target) {
      target.active = false;
      target.live = false;
      target.statusKey = 'dashboard.devices.shutdown';
      this.devices.set([...devices]);
    }

    this.alerts.update(items => items.filter(alert => !alert.danger));

    setTimeout(() => {
      this.shutdownPending.set(false);
      this.feedback.showToast(this.translate.instant('dashboard.toast.shutdownSuccess'), 'success');
    }, 1500);
  }

  onViewAllAlerts() {
    this.router.navigate(['/app/alerts']);
  }

  onAddAlert() {
    const newAlert: AlertEntity = {
      typeKey: 'dashboard.alerts.new.type',
      titleKey: 'dashboard.alerts.new.title',
      descriptionKey: 'dashboard.alerts.new.description',
      timeKey: 'dashboard.alerts.new.time',
      danger: false
    };
    this.alerts.set([newAlert, ...this.alerts()]);
    this.feedback.showToast(this.translate.instant('dashboard.toast.alertCreated'), 'success');
  }

  onAlertDetails(alert: AlertEntity) {
    this.selectedAlert.set(alert);
    this.showAlertModal.set(true);
  }

  closeAlertModal() {
    this.showAlertModal.set(false);
    this.selectedAlert.set(null);
  }

  onDeviceToggle(device: DeviceEntity) {
    device.active = !device.active;
    this.devices.set([...this.devices()]);
    this.feedback.showToast(
      this.translate.instant('dashboard.toast.deviceToggled', {
        name: this.deviceLabel(device),
        status: this.translate.instant(device.active ? 'common.on' : 'common.off'),
      }),
      device.active ? 'success' : 'info'
    );
  }

  onDeviceClick(device: DeviceEntity) {
    this.selectedDevice.set(device);
    this.showDeviceModal.set(true);
  }

  onAddDevice() {
    this.newDeviceName = '';
    this.newDeviceType = 'climate';
    this.showAddDeviceModal.set(true);
  }

  submitAddDevice() {
    if (!this.newDeviceName.trim()) return;

    const iconMap: Record<string, string> = {
      climate: GOOGLE_ICONS.acUnit,
      lights: GOOGLE_ICONS.lightbulb,
      security: GOOGLE_ICONS.videocam,
      generic: GOOGLE_ICONS.deviceHub,
    };

    const newDevice: DeviceEntity = {
      name: this.newDeviceName.trim(),
      statusKey: 'dashboard.devices.readyAdded',
      active: true,
      icon: iconMap[this.newDeviceType] ?? GOOGLE_ICONS.deviceHub,
      live: false,
    };

    this.devices.set([...this.devices(), newDevice]);
    this.closeAddDeviceModal();
    this.feedback.showToast(
      this.translate.instant('dashboard.toast.deviceAdded', { name: newDevice.name }),
      'success'
    );
  }

  onViewEnergySaverDetails() {
    this.showEnergySaverModal.set(true);
  }

  onSelectTimeRange(range: string) {
    this.selectedTimeRange.set(range);
    this.dashboardStore.setEnergyRange(range);
    this.chartRenderKey.update(key => key + 1);
    const rangeKeys: Record<string, string> = {
      '24h': 'dashboard.toast.range24h',
      '7d': 'dashboard.toast.range7d',
      '30d': 'dashboard.toast.range30d',
    };
    this.feedback.showToast(
      this.translate.instant('dashboard.toast.chartUpdated', {
        range: this.translate.instant(rangeKeys[range] ?? range),
      }),
      'info'
    );
  }

  onPointHover(point: EnergyDataPoint, event: MouseEvent) {
    this.hoveredPoint.set(point);
    const chartBody = (event.target as SVGElement).closest('.chart-body') as HTMLElement | null;
    const circle = event.target as SVGElement;
    if (!chartBody) return;

    const chartRect = chartBody.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();

    this.tooltipPosition.set({
      x: circleRect.left - chartRect.left + circleRect.width / 2,
      y: circleRect.top - chartRect.top,
    });
  }

  onPointLeave() {
    this.hoveredPoint.set(null);
  }

  closeDeviceModal() {
    this.showDeviceModal.set(false);
    this.selectedDevice.set(null);
  }

  closeAddDeviceModal() {
    this.showAddDeviceModal.set(false);
  }

  closeEnergySaverModal() {
    this.showEnergySaverModal.set(false);
  }

  onFilterDevices(filter: 'all' | 'online' | 'offline') {
    this.deviceFilter.set(filter);
  }

  navigateToDevices() {
    this.closeDeviceModal();
    this.router.navigate(['/app/devices']);
  }

  readonly chartLayout = {
    width: 600,
    height: 260,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 24,
    plotBottom: 220,
  };

  yAxisTicks = computed(() => {
    const peak = this.currentEnergyData().peak;
    const unit = this.currentEnergyData().unit;
    const steps = [1, 0.75, 0.5, 0.25, 0];

    return steps.map((ratio) => ({
      ratio,
      label: ratio === 1 ? `${peak} ${unit}` : ratio === 0 ? '0' : `${(peak * ratio).toFixed(1)}`,
    }));
  });

  peakPoint = computed(() =>
    this.currentEnergyData().dataPoints.find((point) => point.status === 'peak') ?? null,
  );

  peakBadgePosition = computed(() => {
    const data = this.currentEnergyData();
    const peakIndex = data.dataPoints.findIndex((point) => point.status === 'peak');
    if (peakIndex === -1) return null;

    const x = this.getPointX(peakIndex, data.dataPoints.length);
    const y = this.getPointY(data.peak, data.peak);

    return {
      left: (x / this.chartLayout.width) * 100,
      top: ((y - 36) / this.chartLayout.height) * 100,
    };
  });

  getPointX(index: number, total: number): number {
    const plotWidth = this.chartLayout.width - this.chartLayout.paddingLeft - this.chartLayout.paddingRight;
    if (total <= 1) return this.chartLayout.paddingLeft;
    return this.chartLayout.paddingLeft + (index * plotWidth) / (total - 1);
  }

  getPointY(value: number, maxValue: number): number {
    const plotHeight = this.chartLayout.plotBottom - this.chartLayout.paddingTop;
    const normalized = maxValue > 0 ? (value / maxValue) * plotHeight : 0;
    return this.chartLayout.plotBottom - normalized;
  }

  getGridLineY(ratio: number): number {
    const plotHeight = this.chartLayout.plotBottom - this.chartLayout.paddingTop;
    return this.chartLayout.plotBottom - ratio * plotHeight;
  }

  getLinePoints(dataPoints: EnergyDataPoint[]): string {
    const peak = this.currentEnergyData().peak;
    return dataPoints
      .map((point, i) => `${this.getPointX(i, dataPoints.length)},${this.getPointY(point.value, peak)}`)
      .join(' ');
  }

  getPolygonPoints(dataPoints: EnergyDataPoint[]): string {
    const peak = this.currentEnergyData().peak;
    const linePoints = dataPoints
      .map((point, i) => `${this.getPointX(i, dataPoints.length)},${this.getPointY(point.value, peak)}`)
      .join(' ');

    const lastX = this.getPointX(dataPoints.length - 1, dataPoints.length);
    const baseY = this.chartLayout.plotBottom;
    return `${linePoints} ${lastX},${baseY} ${this.chartLayout.paddingLeft},${baseY}`;
  }
}
