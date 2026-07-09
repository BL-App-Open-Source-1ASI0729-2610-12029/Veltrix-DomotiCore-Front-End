import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BusinessDevicesStore } from '../../../application/business-devices.store';
import { DeviceExplorerStore } from '../../../application/device-explorer.store';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-business-device-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './business-device-detail.component.html',
  styleUrls: ['./business-device-detail.component.css'],
})
export class BusinessDeviceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly businessStore = inject(BusinessDevicesStore);
  private readonly explorerStore = inject(DeviceExplorerStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  readonly icons = GOOGLE_ICONS;

  zoneId = '';
  deviceId = '';

  readonly managedDevice = computed(() => this.businessStore.findDevice(this.zoneId, this.deviceId));

  readonly explorerDevice = computed(() => {
    const devices = this.explorerStore.data()?.devices ?? [];
    return devices.find(device => device.id === this.deviceId) ?? null;
  });

  readonly device = computed(() => this.managedDevice() ?? this.explorerDevice());

  readonly deviceName = computed(
    () => this.managedDevice()?.name ?? this.explorerDevice()?.name ?? '',
  );

  readonly deviceIcon = computed(
    () => this.managedDevice()?.icon ?? this.explorerDevice()?.icon ?? 'deviceHub',
  );

  readonly isOffline = computed(
    () => this.managedDevice()?.offline ?? this.explorerDevice()?.status === 'offline',
  );

  ngOnInit(): void {
    this.zoneId = this.route.snapshot.paramMap.get('zoneId') ?? '';
    this.deviceId = this.route.snapshot.paramMap.get('deviceId') ?? '';

    if (!this.businessStore.overview()) {
      this.businessStore.load().subscribe();
    }

    if (!this.explorerStore.data()) {
      this.explorerStore.load();
    }
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.deviceHub;
  }

  goBack(): void {
    this.router.navigate(['/app/devices/management']);
  }

  openExplorer(): void {
    const zone = this.explorerDevice()?.facilityZone ?? this.mapZoneToFacility(this.zoneId);
    this.router.navigate(['/app/devices/explorer'], {
      queryParams: zone && zone !== 'all' ? { zone } : undefined,
    });
  }

  onToggle(): void {
    const device = this.managedDevice();
    if (!device || device.offline) return;

    const wasActive = device.active;
    this.businessStore.toggleDevice(this.zoneId, this.deviceId);
    this.feedback.showToast(
      this.translate.instant(
        wasActive ? 'businessDevices.detail.toast.turnedOff' : 'businessDevices.detail.toast.turnedOn',
        { name: device.name },
      ),
      'success',
    );
  }

  private mapZoneToFacility(zoneId: string): string {
    const map: Record<string, string> = {
      office: 'main-office',
      warehouse: 'loading-dock',
      retail: 'main-office',
    };
    return map[zoneId] ?? zoneId;
  }
}
