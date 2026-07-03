export interface SmartDeviceResponse {
  id: string;
  name: string;
  icon: string;
  connection: 'online' | 'offline';
  active: boolean;
  powerUsageW: number | null;
  statusLabel?: string;
  batteryPercent?: number | null;
  usageCategory?: 'lighting' | 'climate' | 'security' | 'entertainment' | 'generic';
  isPriority?: boolean;
}

export interface RoomResponse {
  id: string;
  name: string;
  icon: string;
  layout: 'featured' | 'compact' | 'suite';
  activeDeviceCount?: number;
  totalPowerW?: number;
  description?: string;
  temperatureC?: number;
  humidityPercent?: number;
  devices: SmartDeviceResponse[];
}

export interface SceneResponse {
  id: string;
  name: string;
  icon: string;
}

export interface DevicesOverviewResponse {
  id: number;
  totalDevices: number;
  totalRooms: number;
  totalConsumptionKwh: number;
  consumptionComparison: string;
  rooms: RoomResponse[];
  scenes: SceneResponse[];
}
