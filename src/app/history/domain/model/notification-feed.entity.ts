import {
  HistoryInsightsResponse,
  NotificationActionResponse,
  NotificationFeedItemResponse,
  NotificationSection,
  NotificationSeverity,
} from '../../infrastructure/notification-feed-response';

export interface NotificationAction {
  id: string;
  labelKey: string;
  type: NotificationActionResponse['type'];
  icon?: string;
}

export interface NotificationFeedItem {
  id: string;
  section: NotificationSection;
  severity: NotificationSeverity;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  timeLabel: string;
  read: boolean;
  actions: NotificationAction[];
}

export interface HistoryInsights {
  uptimePercent: number;
  uptimeStatusKey: string;
  storageUsedPercent: number;
  storageUsedGb: number;
  storageTotalGb: number;
  storageDescriptionKey: string;
}

export interface GroupedNotificationFeed {
  new: NotificationFeedItem[];
  earlierToday: NotificationFeedItem[];
  yesterday: NotificationFeedItem[];
}

export function mapNotificationFeedItem(dto: NotificationFeedItemResponse): NotificationFeedItem {
  return {
    ...dto,
    actions: dto.actions.map(action => ({ ...action })),
  };
}

export function mapHistoryInsights(dto: HistoryInsightsResponse): HistoryInsights {
  return {
    uptimePercent: dto.uptimePercent,
    uptimeStatusKey: dto.uptimeStatusKey,
    storageUsedPercent: dto.storageUsedPercent,
    storageUsedGb: dto.storageUsedGb,
    storageTotalGb: dto.storageTotalGb,
    storageDescriptionKey: dto.storageDescriptionKey,
  };
}
