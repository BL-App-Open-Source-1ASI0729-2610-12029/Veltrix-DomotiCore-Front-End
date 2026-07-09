import { DeviceDetail } from '../domain/model/device-detail.entity';
import { DeviceDetailResponse } from './device-detail-response';
import { ResourceAuditFields } from '../../shared/models/resource-audit.model';

function mapAudit(dto: ResourceAuditFields): ResourceAuditFields {
  return {
    createdByUserId: dto.createdByUserId,
    createdByName: dto.createdByName,
    createdByEmail: dto.createdByEmail,
    createdByRole: dto.createdByRole,
    createdAt: dto.createdAt,
    updatedByUserId: dto.updatedByUserId,
    updatedByName: dto.updatedByName,
    updatedByEmail: dto.updatedByEmail,
    updatedByRole: dto.updatedByRole,
    updatedAt: dto.updatedAt,
  };
}

export class DeviceDetailAssembler {
  static toDomain(dto: DeviceDetailResponse): DeviceDetail {
    return {
      ...mapAudit(dto),
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
      powerChartPoints: (dto.powerChartPoints ?? []).map(p => ({ ...p })),
      fanSpeed: dto.fanSpeed ?? '—',
      swing: dto.swing ?? '—',
      humidityPercent: dto.humidityPercent ?? 0,
      scheduledTimer: dto.scheduledTimer ?? null,
      alerts: (dto.alerts ?? []).map(a => ({ ...a })),
      lastStateAt: dto.lastStateAt,
      lastStateLabel: dto.lastStateLabel,
      batteryPercent: dto.batteryPercent ?? null,
      brightnessPercent: dto.brightnessPercent,
    };
  }

  static toResponse(entity: DeviceDetail): DeviceDetailResponse {
    return {
      ...mapAudit(entity),
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
      lastStateAt: entity.lastStateAt,
      lastStateLabel: entity.lastStateLabel,
      batteryPercent: entity.batteryPercent,
      brightnessPercent: entity.brightnessPercent,
    };
  }
}
