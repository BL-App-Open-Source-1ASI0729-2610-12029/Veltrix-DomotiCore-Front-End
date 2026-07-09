import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { DeviceExplorerResponse } from './device-explorer-response';

const MOCK_DEVICE_EXPLORER: DeviceExplorerResponse = {
  totalResults: 34,
  pageSize: 4,
  liveCoveragePercent: 98.2,
  facilityZones: ['all', 'main-office', 'north-wing', 'loading-dock', 'cold-storage'],
  protocols: ['MQTT', 'Zigbee', 'Modbus', 'HTTP'],
  categories: ['hvac', 'lighting', 'security', 'sensors', 'powerPlugs'],
  devices: [
    {
      id: 'dev-1',
      deviceId: 'SN-TEMP-401',
      name: 'Honeywell SmartSensor Pro',
      icon: 'thermostat',
      ipAddress: '192.168.12.104',
      zoneHierarchyKey: 'deviceExplorer.zones.lobby',
      facilityZone: 'main-office',
      status: 'online',
      category: 'sensors',
      protocol: 'MQTT',
      subnet: '192.168.12',
      online: true,
      firmwareOutdated: false,
      mapX: 80,
      mapY: 21,
    },
    {
      id: 'dev-2',
      deviceId: 'LT-GRID-882',
      name: 'Philips Hue Enterprise Grid',
      icon: 'lightbulb',
      ipAddress: '192.168.12.118',
      zoneHierarchyKey: 'deviceExplorer.zones.northWing',
      facilityZone: 'north-wing',
      status: 'standby',
      category: 'lighting',
      protocol: 'MQTT',
      subnet: '192.168.12',
      online: true,
      firmwareOutdated: true,
      mapX: 83,
      mapY: 14,
    },
    {
      id: 'dev-3',
      deviceId: 'SEC-CAM-219',
      name: 'Axis P3245-V Dome',
      icon: 'videocam',
      ipAddress: '192.168.14.032',
      zoneHierarchyKey: 'deviceExplorer.zones.loadingDock',
      facilityZone: 'loading-dock',
      status: 'offline',
      category: 'security',
      protocol: 'HTTP',
      subnet: '192.168.14',
      online: false,
      firmwareOutdated: false,
      mapX: 86,
      mapY: 62,
    },
    {
      id: 'dev-4',
      deviceId: 'HVAC-CTRL-07',
      name: 'Carrier OptiControl 500',
      icon: 'acUnit',
      ipAddress: '192.168.12.201',
      zoneHierarchyKey: 'deviceExplorer.zones.mainOffice',
      facilityZone: 'main-office',
      status: 'online',
      category: 'hvac',
      protocol: 'Modbus',
      subnet: '192.168.12',
      online: true,
      firmwareOutdated: true,
      mapX: 18,
      mapY: 17,
    },
    {
      id: 'dev-5',
      deviceId: 'PWR-PLG-144',
      name: 'Shelly Pro 3EM',
      icon: 'plug',
      ipAddress: '192.168.12.155',
      zoneHierarchyKey: 'deviceExplorer.zones.kitchen',
      facilityZone: 'main-office',
      status: 'online',
      category: 'powerPlugs',
      protocol: 'MQTT',
      subnet: '192.168.12',
      online: true,
      firmwareOutdated: false,
      mapX: 14,
      mapY: 48,
    },
    {
      id: 'dev-6',
      deviceId: 'SN-HUM-332',
      name: 'Sensirion SHT40 Node',
      icon: 'airPurifier',
      ipAddress: '192.168.14.088',
      zoneHierarchyKey: 'deviceExplorer.zones.coldStorage',
      facilityZone: 'cold-storage',
      status: 'standby',
      category: 'sensors',
      protocol: 'Zigbee',
      subnet: '192.168.14',
      online: true,
      firmwareOutdated: false,
      mapX: 16,
      mapY: 81,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class DeviceExplorerApiService {
  private readonly api = inject(ApiClientService);

  getDeviceExplorer(): Observable<DeviceExplorerResponse> {
    if (this.api.hasApi()) {
      return this.api
        .getObjectWithParams<DeviceExplorerResponse>('device-explorer', {})
        .pipe(catchError(() => this.mockDeviceExplorer()));
    }
    return this.mockDeviceExplorer();
  }

  private mockDeviceExplorer(): Observable<DeviceExplorerResponse> {
    return of(structuredClone(MOCK_DEVICE_EXPLORER)).pipe(delay(350));
  }
}
