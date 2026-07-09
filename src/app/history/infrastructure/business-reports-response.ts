import { ConsumptionDataPointResponse } from './history-response';

export type ReportsChartPeriod = 'weekly' | 'monthly';
export type ReportsPeriod = 'thisMonth' | 'lastMonth' | 'thisQuarter';
export type DeviceReportTrend = 'up' | 'down' | 'stable';
export type DeviceReportStatus = 'OPTIMAL' | 'STEADY';

export interface ZoneUsageResponse {
  id: string;
  name: string;
  usageKwh: number;
}

export interface PeakUsageAlertResponse {
  titleKey: string;
  timeLabel: string;
  messageKey: string;
}

export interface DeviceReportResponse {
  id: string;
  name: string;
  sublabelKey: string;
  zone: string;
  consumptionKwh: number;
  trendPercent: number;
  trend: DeviceReportTrend;
  status: DeviceReportStatus;
  icon: string;
}

export interface BusinessReportsResponse {
  efficiencyGoalPercent: number;
  efficiencyLabelKey: string;
  efficiencyComparisonKey: string;
  weeklyChart: ConsumptionDataPointResponse[];
  monthlyChart: ConsumptionDataPointResponse[];
  zones: ZoneUsageResponse[];
  peakAlert: PeakUsageAlertResponse;
  devices: DeviceReportResponse[];
}
