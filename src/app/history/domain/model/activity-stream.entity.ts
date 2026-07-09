import {
  ActivityAction,
  ActivityDeviceType,
  ActivityStatus,
  ActivityStreamEntryResponse,
  EventVolumeDayResponse,
  HistorySummaryResponse,
  SecurityAlertResponse,
} from '../../infrastructure/activity-stream-response';

export interface ActivityStreamEntry {
  id: string;
  occurredAt: string;
  deviceName: string;
  deviceModel: string;
  deviceIcon: string;
  deviceType: ActivityDeviceType;
  action: ActivityAction;
  actionLabel: string;
  location: string;
  status: ActivityStatus;
  consumptionKwh?: number;
}

export interface HistorySummary {
  uptimePercent: number;
  lastSyncMinutesAgo: number;
  eventVolumeByDay: EventVolumeDayResponse[];
  securityAlerts: SecurityAlertResponse[];
  totalEntries: number;
}

export type DateRangeFilter = 'last_24h' | 'last_7d' | 'last_30d';

export function mapActivityEntry(dto: ActivityStreamEntryResponse): ActivityStreamEntry {
  return { ...dto };
}

export function mapHistorySummary(dto: HistorySummaryResponse): HistorySummary {
  return {
    uptimePercent: dto.uptimePercent,
    lastSyncMinutesAgo: dto.lastSyncMinutesAgo,
    eventVolumeByDay: dto.eventVolumeByDay.map(d => ({ ...d })),
    securityAlerts: dto.securityAlerts.map(a => ({ ...a })),
    totalEntries: dto.totalEntries,
  };
}
