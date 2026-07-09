import { DevicesOverview } from '../domain/model/devices-overview.entity';
import { DevicesOverviewResponse } from './devices-overview-response';

export class DevicesOverviewAssembler {
  static toDomain(dto: DevicesOverviewResponse): DevicesOverview {
    return {
      totalDevices: dto.totalDevices,
      totalRooms: dto.totalRooms,
      totalConsumptionKwh: dto.totalConsumptionKwh,
      consumptionComparison: dto.consumptionComparison,
      rooms: dto.rooms.map(room => ({
        ...room,
        devices: room.devices.map(device => ({ ...device })),
      })),
      scenes: dto.scenes.map(scene => ({ ...scene })),
    };
  }
}
