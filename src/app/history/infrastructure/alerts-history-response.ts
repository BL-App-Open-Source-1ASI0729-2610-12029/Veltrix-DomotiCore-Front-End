export type AlertPriority = 'critical' | 'medium' | 'low';
export type AlertLogTab = 'all' | 'alerts' | 'manual';
export type AlertEventStatus = 'unresolved' | 'acknowledged' | 'systemNormal' | 'investigating';
export type AlertLogCategory = 'alert' | 'manual' | 'system';

export interface AlertsSummaryResponse {
  criticalAlerts: number;
  deviceFailures: number;
  energyPeaks: number;
  resolutionPercent: number;
}

export interface AlertLogEntryResponse {
  id: string;
  priority: AlertPriority;
  titleKey: string;
  detailKey: string;
  locationKey: string;
  locationIcon: string;
  timestamp: string;
  status: AlertEventStatus;
  category: AlertLogCategory;
}

export interface AlertFrequencyInsightResponse {
  percent: number;
  locationKey: string;
  primaryAlertKey: string;
}

export interface MeanTimeInsightResponse {
  minutes: number;
  seconds: number;
  trendPercent: number;
  trendImproved: boolean;
}

export interface SystemIntegrityInsightResponse {
  stabilityPercent: number;
  statusKey: string;
}

export interface AlertsHistoryResponse {
  summary: AlertsSummaryResponse;
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  entries: AlertLogEntryResponse[];
  alertFrequency: AlertFrequencyInsightResponse;
  meanTimeToResolve: MeanTimeInsightResponse;
  systemIntegrity: SystemIntegrityInsightResponse;
}
