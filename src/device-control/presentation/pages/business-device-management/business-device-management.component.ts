import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessDevicesStore } from '../../../application/business-devices.store';
import {
  BusinessDeviceTableRowResponse,
  BusinessZoneResponse,
} from '../../../infrastructure/business-devices-response';
import { BusinessDevicesNavComponent } from '../../components/business-devices-nav/business-devices-nav.component';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { matchesSearchQuery } from '../../../../shared/utils/text-search.util';
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
  readonly searchQuery = signal('');

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.searchQuery.set(params.get('q') ?? '');
    });
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
    if (!this.feedback.confirmAction(this.translate.instant('businessDevices.confirm.turnAllOff'))) return;
    this.store.turnAllOff();
    this.feedback.showToast(this.translate.instant('businessDevices.toast.turnAllOff'), 'info');
  }

  onTurnAllOn(): void {
    if (!this.feedback.confirmAction(this.translate.instant('businessDevices.confirm.turnAllOn'))) return;
    const failed = this.store.turnAllOn();
    if (failed.length) {
      this.feedback.showToast(
        this.translate.instant('businessDevices.toast.turnAllOnPartial', { devices: failed.join(', ') }),
        'warning',
      );
      return;
    }
    this.feedback.showToast(this.translate.instant('businessDevices.toast.turnAllOn'), 'success');
  }

  zoneVisible(zoneName: string, deviceNames: string[]): boolean {
    const query = this.searchQuery().trim();
    if (!query) return true;
    if (matchesSearchQuery(zoneName, query)) return true;
    return deviceNames.some(name => matchesSearchQuery(name, query));
  }

  zoneDeviceNames(zone: BusinessZoneResponse): string[] {
    const names: string[] = [];
    zone.cards?.forEach(card => names.push(card.name));
    zone.tableRows?.forEach(row => names.push(row.name));
    return names;
  }

  filterCards(zone: BusinessZoneResponse) {
    const cards = zone.cards ?? [];
    const query = this.searchQuery().trim();
    if (!query) return cards;
    return cards.filter(card => matchesSearchQuery(card.name, query));
  }

  filterTableRows(zone: BusinessZoneResponse) {
    const rows = zone.tableRows ?? [];
    const query = this.searchQuery().trim();
    if (!query) return rows;
    return rows.filter(row => matchesSearchQuery(row.name, query));
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
