export type NotificationSection = 'new' | 'earlier_today' | 'yesterday';
export type NotificationSeverity = 'critical' | 'info' | 'success' | 'warning' | 'security';
export type NotificationActionType = 'link' | 'button' | 'icon';

export interface NotificationActionResponse {
  id: string;
  labelKey: string;
  type: NotificationActionType;
  icon?: string;
}

export interface NotificationFeedItemResponse {
  id: string;
  section: NotificationSection;
  severity: NotificationSeverity;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  timeLabel: string;
  read: boolean;
  actions: NotificationActionResponse[];
}

export interface HistoryInsightsResponse {
  id: number;
  uptimePercent: number;
  uptimeStatusKey: string;
  storageUsedPercent: number;
  storageUsedGb: number;
  storageTotalGb: number;
  storageDescriptionKey: string;
}
