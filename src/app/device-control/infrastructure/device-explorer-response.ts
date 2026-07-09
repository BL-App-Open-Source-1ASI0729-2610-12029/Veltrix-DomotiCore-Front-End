export type ExplorerDeviceStatus = 'online' | 'standby' | 'offline';
export type ExplorerDeviceCategory =
  | 'hvac'
  | 'lighting'
  | 'security'
  | 'sensors'
  | 'powerPlugs';

export interface ExplorerDeviceResponse {
  id: string;
  deviceId: string;
  name: string;
  icon: string;
  ipAddress: string;
  zoneHierarchyKey: string;
  facilityZone: string;
  status: ExplorerDeviceStatus;
  category: ExplorerDeviceCategory;
  protocol: string;
  subnet: string;
  online: boolean;
  firmwareOutdated: boolean;
  mapX: number;
  mapY: number;
}

export interface DeviceExplorerResponse {
  totalResults: number;
  pageSize: number;
  liveCoveragePercent: number;
  facilityZones: string[];
  protocols: string[];
  categories: ExplorerDeviceCategory[];
  devices: ExplorerDeviceResponse[];
}
