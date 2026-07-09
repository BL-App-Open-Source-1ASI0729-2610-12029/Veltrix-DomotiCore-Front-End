import { Injectable, computed, inject, signal } from '@angular/core';
import { DeviceExplorerApiService } from '../infrastructure/device-explorer-api.service';
import {
  DeviceExplorerResponse,
  ExplorerDeviceCategory,
  ExplorerDeviceResponse,
} from '../infrastructure/device-explorer-response';

export interface AddExplorerDevicePayload {
  name: string;
  facilityZone: string;
  category: ExplorerDeviceCategory;
  protocol: string;
}

const CATEGORY_ICONS: Record<ExplorerDeviceCategory, string> = {
  hvac: 'acUnit',
  lighting: 'lightbulb',
  security: 'videocam',
  sensors: 'sensors',
  powerPlugs: 'plug',
};

const ZONE_HIERARCHY_KEYS: Record<string, string> = {
  'main-office': 'deviceExplorer.zones.mainOffice',
  'north-wing': 'deviceExplorer.zones.northWing',
  'loading-dock': 'deviceExplorer.zones.loadingDock',
  'cold-storage': 'deviceExplorer.zones.coldStorage',
};

@Injectable({ providedIn: 'root' })
export class DeviceExplorerStore {
  private readonly api = inject(DeviceExplorerApiService);

  readonly data = signal<DeviceExplorerResponse | null>(null);
  readonly loading = signal(false);
  readonly scanning = signal(false);
  readonly facilityZone = signal('all');
  readonly selectedCategories = signal<ExplorerDeviceCategory[]>([]);
  readonly protocol = signal('MQTT');
  readonly subnet = signal('');
  readonly onlineOnly = signal(true);
  readonly firmwareOutdated = signal(false);
  readonly currentPage = signal(1);
  readonly viewMode = signal<'list' | 'grid'>('list');
  readonly nameQuery = signal('');

  readonly filteredDevices = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const categories = this.selectedCategories();
    const subnetQuery = this.subnet().trim();
    const zone = this.facilityZone();
    const protocol = this.protocol();
    const onlineOnly = this.onlineOnly();
    const outdatedOnly = this.firmwareOutdated();
    const nameQuery = this.nameQuery().trim().toLowerCase();

    return payload.devices.filter(device => {
      const matchesName = !nameQuery || device.name.toLowerCase().includes(nameQuery);
      const matchesZone = zone === 'all' || device.facilityZone === zone;
      const matchesCategory =
        !categories.length || categories.includes(device.category);
      const matchesProtocol = device.protocol === protocol;
      const matchesSubnet = !subnetQuery || device.subnet.includes(subnetQuery);
      const matchesOnline = !onlineOnly || device.online;
      const matchesOutdated = !outdatedOnly || device.firmwareOutdated;
      return (
        matchesName &&
        matchesZone &&
        matchesCategory &&
        matchesProtocol &&
        matchesSubnet &&
        matchesOnline &&
        matchesOutdated
      );
    });
  });

  readonly resultCount = computed(() => this.filteredDevices().length);

  readonly pagedDevices = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const start = (this.currentPage() - 1) * payload.pageSize;
    return this.filteredDevices().slice(start, start + payload.pageSize);
  });

  readonly totalPages = computed(() => {
    const payload = this.data();
    if (!payload) return 1;
    const total = this.filteredDevices().length;
    return Math.max(1, Math.ceil(total / payload.pageSize));
  });

  readonly paginationLabel = computed(() => {
    const payload = this.data();
    if (!payload) return '';

    const total = this.filteredDevices().length;
    if (!total) return '0-0:0';

    const start = (this.currentPage() - 1) * payload.pageSize + 1;
    const end = Math.min(this.currentPage() * payload.pageSize, total);
    return `${start}-${end}:${total}`;
  });

  load(): void {
    this.loading.set(true);
    this.api.getDeviceExplorer().subscribe({
      next: payload => {
        this.data.set(payload);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFacilityZone(zone: string): void {
    this.facilityZone.set(zone);
    this.currentPage.set(1);
  }

  setNameQuery(query: string): void {
    this.nameQuery.set(query);
    this.currentPage.set(1);
  }

  setProtocol(protocol: string): void {
    this.protocol.set(protocol);
    this.currentPage.set(1);
  }

  setSubnet(value: string): void {
    this.subnet.set(value);
    this.currentPage.set(1);
  }

  toggleCategory(category: ExplorerDeviceCategory): void {
    this.selectedCategories.update(current => {
      if (current.includes(category)) {
        return current.filter(item => item !== category);
      }
      return [...current, category];
    });
    this.currentPage.set(1);
  }

  isCategorySelected(category: ExplorerDeviceCategory): boolean {
    return this.selectedCategories().includes(category);
  }

  toggleOnlineOnly(): void {
    this.onlineOnly.update(value => !value);
    this.currentPage.set(1);
  }

  toggleFirmwareOutdated(): void {
    this.firmwareOutdated.update(value => !value);
    this.currentPage.set(1);
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode.set(mode);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
  }

  addDevice(payload: AddExplorerDevicePayload): ExplorerDeviceResponse | null {
    const trimmed = payload.name.trim();
    if (!trimmed) return null;

    const stamp = Date.now();
    const device: ExplorerDeviceResponse = {
      id: `dev-${stamp}`,
      deviceId: `SN-NEW-${stamp.toString().slice(-4)}`,
      name: trimmed,
      icon: CATEGORY_ICONS[payload.category],
      ipAddress: `192.168.12.${Math.floor(Math.random() * 180) + 20}`,
      zoneHierarchyKey: ZONE_HIERARCHY_KEYS[payload.facilityZone] ?? 'deviceExplorer.zones.mainOffice',
      facilityZone: payload.facilityZone,
      status: 'online',
      category: payload.category,
      protocol: payload.protocol,
      subnet: '192.168.12',
      online: true,
      firmwareOutdated: false,
      mapX: Number((18 + Math.random() * 64).toFixed(1)),
      mapY: Number((14 + Math.random() * 70).toFixed(1)),
    };

    this.data.update(current => {
      if (!current) return current;
      return {
        ...current,
        totalResults: current.totalResults + 1,
        devices: [device, ...current.devices],
      };
    });

    this.facilityZone.set(payload.facilityZone);
    this.selectedCategories.set([]);
    this.currentPage.set(1);
    return device;
  }

  runNetworkScan(): void {
    if (this.scanning()) return;

    this.scanning.set(true);
    window.setTimeout(() => {
      this.data.update(current => {
        if (!current) return current;

        const scanId = `scan-${Date.now()}`;
        return {
          ...current,
          totalResults: current.totalResults + 1,
          devices: [
            {
              id: scanId,
              deviceId: `SN-AUTO-${Date.now().toString().slice(-4)}`,
              name: 'Discovered IoT Node',
              icon: 'sensors',
              ipAddress: '192.168.10.42',
              zoneHierarchyKey: 'deviceExplorer.zones.loadingDock',
              facilityZone: 'loading-dock',
              status: 'online' as const,
              category: 'sensors' as const,
              protocol: 'MQTT',
              subnet: '192.168.10',
              online: true,
              firmwareOutdated: false,
              mapX: 86,
              mapY: 62,
            },
            ...current.devices,
          ],
        };
      });
      this.scanning.set(false);
    }, 1800);
  }
}
