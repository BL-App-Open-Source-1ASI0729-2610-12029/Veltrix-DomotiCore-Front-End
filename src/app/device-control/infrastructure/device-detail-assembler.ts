import { DeviceDetail } from '../domain/model/device-detail.entity';
import { DeviceDetailResponse } from './device-detail-response';

export class DeviceDetailAssembler {
  static toDomain(dto: DeviceDetailResponse): DeviceDetail {
    return {
      id: dto.id,
      roomId: dto.roomId,
      roomName: dto.roomName,
      name: dto.name,
      icon: dto.icon,
      deviceType: dto.deviceType,
      connection: dto.connection,
      active: dto.active,
      currentTempC: dto.currentTempC ?? 0,
      targetTempC: dto.targetTempC ?? 0,
      operationMode: dto.operationMode ?? 'cool',
      ecoMode: dto.ecoMode ?? false,
      powerLoadKw: dto.powerLoadKw,
      powerChartPeriod: dto.powerChartPeriod,
      powerChartPoints: dto.powerChartPoints.map(p => ({ ...p })),
      fanSpeed: dto.fanSpeed ?? '—',
      swing: dto.swing ?? '—',
      humidityPercent: dto.humidityPercent ?? 0,
      scheduledTimer: dto.scheduledTimer ?? null,
      alerts: dto.alerts.map(a => ({ ...a })),
    };
  }

  static toResponse(entity: DeviceDetail): DeviceDetailResponse {
    return {
      id: entity.id,
      roomId: entity.roomId,
      roomName: entity.roomName,
      name: entity.name,
      icon: entity.icon,
      deviceType: entity.deviceType,
      connection: entity.connection,
      active: entity.active,
      currentTempC: entity.currentTempC,
      targetTempC: entity.targetTempC,
      operationMode: entity.operationMode,
      ecoMode: entity.ecoMode,
      powerLoadKw: entity.powerLoadKw,
      powerChartPeriod: entity.powerChartPeriod,
      powerChartPoints: entity.powerChartPoints,
      fanSpeed: entity.fanSpeed,
      swing: entity.swing,
      humidityPercent: entity.humidityPercent,
      scheduledTimer: entity.scheduledTimer,
      alerts: entity.alerts,
    };
  }
}
