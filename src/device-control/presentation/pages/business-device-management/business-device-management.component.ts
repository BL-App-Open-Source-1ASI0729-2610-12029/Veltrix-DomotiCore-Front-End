import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessDevicesStore } from '../../../application/business-devices.store';
import {
  BusinessDeviceTableRowResponse,
  BusinessZoneResponse,
} from '../../../infrastructure/business-devices-response';
import { BusinessDevicesNavComponent } from '../../components/business-devices-nav/business-devices-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-business-device-management',
  standalone: true,
  imports: [CommonModule, TranslateModule, BusinessDevicesNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './business-device-management.component.html',
  styleUrls: ['./business-device-management.component.css'],
})
export class BusinessDeviceManagementComponent implements OnInit {
  readonly store = inject(BusinessDevicesStore);
  readonly icons = GOOGLE_ICONS;

  readonly showAddEnvironmentModal = signal(false);
  readonly newEnvironmentName = signal('');

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  zoneTitle(zone: BusinessZoneResponse): string {
    return this.translate.instant('businessDevices.zoneDevices', {
      name: zone.name,
      count: zone.deviceCount,
    });
  }

  tableStatusClass(status: BusinessDeviceTableRowResponse['status']): string {
    return `status-badge status-badge--${status.toLowerCase()}`;
  }

  tableStatusKey(status: BusinessDeviceTableRowResponse['status']): string {
    return `businessDevices.tableStatus.${status.toLowerCase()}`;
  }

  onTurnAllOff(): void {
    this.store.turnAllOff();
    this.feedback.showToast(this.translate.instant('businessDevices.toast.turnAllOff'), 'info');
  }

  onTurnAllOn(): void {
    this.store.turnAllOn();
    this.feedback.showToast(this.translate.instant('businessDevices.toast.turnAllOn'), 'success');
  }

  onTogglePriority(zoneId: string, deviceId: string, event: Event): void {
    event.stopPropagation();
    this.store.toggleDevicePriority(zoneId, deviceId);
    this.feedback.showToast(this.translate.instant('businessDevices.toast.priorityUpdated'), 'success');
  }

  onEnableEco(zone: BusinessZoneResponse): void {
    if (zone.ecoModeEnabled) {
      this.feedback.showToast(
        this.translate.instant('businessDevices.toast.ecoAlreadyEnabled', { zone: zone.name }),
        'info',
      );
      return;
    }

    this.store.enableEcoMode(zone.id);
    this.feedback.showToast(
      this.translate.instant('businessDevices.toast.ecoEnabled', { zone: zone.name }),
      'success',
    );
  }

  onViewAll(zone: BusinessZoneResponse): void {
    const zoneMap: Record<string, string> = {
      office: 'main-office',
      warehouse: 'loading-dock',
      retail: 'main-office',
    };
    this.router.navigate(['/app/devices/explorer'], {
      queryParams: { zone: zoneMap[zone.id] ?? zone.id },
    });
  }

  onOpenDevice(zoneId: string, deviceId: string): void {
    this.router.navigate(['/app/devices', zoneId, deviceId]);
  }

  onAddEnvironment(): void {
    this.newEnvironmentName.set('');
    this.showAddEnvironmentModal.set(true);
  }

  closeAddEnvironmentModal(): void {
    this.showAddEnvironmentModal.set(false);
  }

  confirmAddEnvironment(): void {
    const name = this.newEnvironmentName().trim();
    if (!name) {
      this.feedback.showToast(this.translate.instant('businessDevices.toast.environmentNameRequired'), 'warning');
      return;
    }

    this.store.addEnvironmentZone(name);
    this.showAddEnvironmentModal.set(false);
    this.feedback.showToast(
      this.translate.instant('businessDevices.toast.environmentAdded', { name }),
      'success',
    );
  }

  barHeight(value: number, bars: number[]): number {
    const max = Math.max(...bars, 1);
    return (value / max) * 100;
  }
}
