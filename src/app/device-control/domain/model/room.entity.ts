import { SmartDevice } from './smart-device.entity';

export type RoomLayout = 'featured' | 'compact' | 'suite';

export interface Room {
  id: string;
  name: string;
  nameKey?: string;
  icon: string;
  layout: RoomLayout;
  activeDeviceCount?: number;
  totalPowerW?: number;
  description?: string;
  temperatureC?: number;
  humidityPercent?: number;
  devices: SmartDevice[];
}
