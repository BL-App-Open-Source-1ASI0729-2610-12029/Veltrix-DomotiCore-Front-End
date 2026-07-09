import { Room } from './room.entity';
import { Scene } from './scene.entity';

export interface DevicesOverview {
  totalDevices: number;
  totalRooms: number;
  totalConsumptionKwh: number;
  consumptionComparison: string;
  rooms: Room[];
  scenes: Scene[];
}
