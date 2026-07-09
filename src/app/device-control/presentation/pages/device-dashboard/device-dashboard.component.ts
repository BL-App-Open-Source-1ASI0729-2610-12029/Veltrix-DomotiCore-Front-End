import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DevicesOverviewStore, NewDeviceType } from '../../../application/devices-overview.store';
import { Room } from '../../../domain/model/room.entity';
import { SmartDevice } from '../../../domain/model/smart-device.entity';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { matchesSearchQuery } from '../../../../shared/utils/text-search.util';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-device-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './device-dashboard.component.html',
  styleUrls: ['./device-dashboard.component.css'],
})
export class DeviceDashboardComponent implements OnInit {
  readonly store = inject(DevicesOverviewStore);
  readonly icons = GOOGLE_ICONS;

  readonly showAddModal = signal(false);
  readonly showCategoryModal = signal(false);
  readonly searchQuery = signal('');
  readonly categoryDeviceRoomId = signal('');
  readonly categoryDeviceId = signal('');
  readonly selectedCategory = signal<SmartDevice['usageCategory']>('generic');
  newDeviceName = '';
  selectedRoomId = 'living-room';
  selectedDeviceType: NewDeviceType = 'generic';

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly feedback = inject(UiFeedbackService);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.searchQuery.set(params.get('q') ?? '');
    });
    this.store.loadOverview().subscribe();
  }

  onRefresh(): void {
    this.store.refreshOverview().subscribe({
      next: () => this.feedback.showToast(this.translate.instant('myDevices.toast.refreshed'), 'success'),
      error: () => this.feedback.showToast(this.translate.instant('myDevices.toast.refreshFailed'), 'error'),
    });
  }

  onTurnOnAll(): void {
    if (!this.feedback.confirmAction(this.translate.instant('myDevices.confirm.turnOnAll'))) return;

    const failed = this.store.turnOnAll();
    if (failed.length) {
      this.feedback.showToast(
        this.translate.instant('myDevices.toast.turnOnAllPartial', { devices: failed.join(', ') }),
        'warning',
      );
      return;
    }
    this.feedback.showToast(this.translate.instant('myDevices.toast.turnOnAll'), 'success');
  }

  onEcoMode(): void {
    if (!this.feedback.confirmAction(this.translate.instant('myDevices.confirm.ecoMode'))) return;
    this.store.applyEcoMode();
    this.feedback.showToast(this.translate.instant('myDevices.toast.ecoMode'), 'info');
  }

  roomMatchesSearch(room: Room): boolean {
    const query = this.searchQuery().trim();
    if (!query) return true;
    if (matchesSearchQuery(room.name, query)) return true;
    return room.devices.some(device => matchesSearchQuery(device.name, query));
  }

  filterDevices(devices: SmartDevice[]): SmartDevice[] {
    const query = this.searchQuery().trim();
    if (!query) return devices;
    return devices.filter(device => matchesSearchQuery(device.name, query));
  }

  onTogglePriority(roomId: string, device: SmartDevice, event: Event): void {
    event.stopPropagation();
    this.store.toggleDevicePriority(roomId, device.id);
    const key = device.isPriority ? 'myDevices.toast.priorityRemoved' : 'myDevices.toast.prioritySet';
    this.feedback.showToast(this.translate.instant(key, { name: device.name }), 'success');
  }

  openCategoryModal(roomId: string, device: SmartDevice, event: Event): void {
    event.stopPropagation();
    this.categoryDeviceRoomId.set(roomId);
    this.categoryDeviceId.set(device.id);
    this.selectedCategory.set(device.usageCategory ?? 'generic');
    this.showCategoryModal.set(true);
  }

  saveCategory(): void {
    this.store.setDeviceCategory(
      this.categoryDeviceRoomId(),
      this.categoryDeviceId(),
      this.selectedCategory(),
    );
    this.showCategoryModal.set(false);
    this.feedback.showToast(this.translate.instant('myDevices.toast.categorySaved'), 'success');
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  getRoomIconClass(room: Room): string {
    return `room-icon room-icon--${room.id}`;
  }

  getConnectionLabel(device: SmartDevice): string {
    if (device.statusLabel) return device.statusLabel;
    if (device.connection === 'offline') return this.translate.instant('common.offline');
    return this.translate.instant('common.online');
  }

  getPowerLabel(device: SmartDevice): string {
    if (device.connection === 'offline' || device.powerUsageW === null) return '--';
    return `${device.powerUsageW}W`;
  }

  getBatteryLabel(device: SmartDevice): string | null {
    if (device.batteryPercent == null) return null;
    return `${device.batteryPercent}%`;
  }

  categoryLabelKey(category: SmartDevice['usageCategory'] | undefined): string {
    return `myDevices.categories.${category ?? 'generic'}`;
  }

  isToggleDisabled(device: SmartDevice): boolean {
    return device.connection === 'offline';
  }

  onToggle(roomId: string, device: SmartDevice): void {
    if (this.isToggleDisabled(device)) return;
    this.store.toggleDevice(roomId, device.id);
  }

  onScene(sceneId: string): void {
    this.store.activateScene(sceneId);
  }

  openDevice(roomId: string, deviceId: string): void {
    this.router.navigate(['/app/devices', roomId, deviceId]);
  }

  openAddModal(): void {
    this.newDeviceName = '';
    this.selectedRoomId = 'living-room';
    this.selectedDeviceType = 'generic';
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
  }

  submitAddDevice(): void {
    if (!this.newDeviceName.trim()) return;

    this.store.addDevice(this.selectedRoomId, this.newDeviceName, this.selectedDeviceType).subscribe({
      next: detail => {
        this.closeAddModal();
        this.router.navigate(['/app/devices', this.selectedRoomId, detail.id]);
      },
    });
  }
}
