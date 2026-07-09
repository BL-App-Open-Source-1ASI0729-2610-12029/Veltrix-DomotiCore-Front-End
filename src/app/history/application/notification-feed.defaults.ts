import {
  HistoryInsights,
  NotificationFeedItem,
} from '../domain/model/notification-feed.entity';

export const DEFAULT_NOTIFICATION_FEED: NotificationFeedItem[] = [
  {
    id: 'nf-1',
    section: 'new',
    severity: 'critical',
    icon: 'warning',
    titleKey: 'historyNotifications.items.powerSpike.title',
    descriptionKey: 'historyNotifications.items.powerSpike.description',
    timeLabel: 'Just now',
    read: false,
    actions: [
      { id: 'view', labelKey: 'historyNotifications.actions.viewDetails', type: 'link' },
      { id: 'mute', labelKey: 'historyNotifications.actions.muteCircuit', type: 'button' },
    ],
  },
  {
    id: 'nf-2',
    section: 'new',
    severity: 'info',
    icon: 'info',
    titleKey: 'historyNotifications.items.ecoMode.title',
    descriptionKey: 'historyNotifications.items.ecoMode.description',
    timeLabel: '12m ago',
    read: false,
    actions: [
      { id: 'view', labelKey: 'historyNotifications.actions.viewDetails', type: 'link' },
    ],
  },
  {
    id: 'nf-3',
    section: 'earlier_today',
    severity: 'success',
    icon: 'checkCircle',
    titleKey: 'historyNotifications.items.firmwareUpdate.title',
    descriptionKey: 'historyNotifications.items.firmwareUpdate.description',
    timeLabel: '2h ago',
    read: true,
    actions: [
      { id: 'view', labelKey: 'historyNotifications.actions.viewDetails', type: 'link' },
    ],
  },
  {
    id: 'nf-4',
    section: 'earlier_today',
    severity: 'warning',
    icon: 'emergency',
    titleKey: 'historyNotifications.items.batteryLow.title',
    descriptionKey: 'historyNotifications.items.batteryLow.description',
    timeLabel: '4h ago',
    read: false,
    actions: [
      { id: 'dismiss', labelKey: 'historyNotifications.actions.dismiss', type: 'button' },
      { id: 'shop', labelKey: 'historyNotifications.actions.orderBattery', type: 'icon', icon: 'shopping' },
    ],
  },
  {
    id: 'nf-5',
    section: 'yesterday',
    severity: 'security',
    icon: 'lock',
    titleKey: 'historyNotifications.items.doorLocked.title',
    descriptionKey: 'historyNotifications.items.doorLocked.description',
    timeLabel: 'Yesterday, 9:42 PM',
    read: true,
    actions: [
      { id: 'view', labelKey: 'historyNotifications.actions.viewDetails', type: 'link' },
    ],
  },
];

export const DEFAULT_HISTORY_INSIGHTS: HistoryInsights = {
  uptimePercent: 99.98,
  uptimeStatusKey: 'historyNotifications.insights.optimal',
  storageUsedPercent: 42,
  storageUsedGb: 4.2,
  storageTotalGb: 10,
  storageDescriptionKey: 'historyNotifications.insights.storageDescription',
};
