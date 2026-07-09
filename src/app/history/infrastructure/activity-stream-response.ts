export type ActivityAction =
  | 'turned_on'
  | 'turned_off'
  | 'triggered_alert'
  | 'scheduled'
  | 'connection_lost'
  | 'consumption_update';

export type ActivityStatus = 'success' | 'critical' | 'warning';
export type ActivityDeviceType = 'lighting' | 'sensor' | 'climate' | 'camera' | 'appliance';

export interface ActivityStreamEntryResponse {
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

export interface SecurityAlertResponse {
  id: string;
  title: string;
  hoursAgo: number;
  type: 'warning' | 'info' | 'critical';
}

export interface EventVolumeDayResponse {
  day: string;
  value: number;
}

export interface HistorySummaryResponse {
  id: number;
  uptimePercent: number;
  lastSyncMinutesAgo: number;
  eventVolumeByDay: EventVolumeDayResponse[];
  securityAlerts: SecurityAlertResponse[];
  totalEntries: number;
}
