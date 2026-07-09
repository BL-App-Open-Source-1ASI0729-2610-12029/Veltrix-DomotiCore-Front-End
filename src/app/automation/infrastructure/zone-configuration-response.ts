export type ZoneIcon = 'building' | 'loading' | 'kitchen';
export type InsightType = 'warning' | 'success';
export type AuditModifierType = 'user' | 'system';
export type AuditStatus = 'applied';

export type OvertimeType = 'manual' | 'motion' | 'photo';

export interface ZoneScheduleResponse {
  morningOn: string;
  eveningOff: string;
  overtimeRule: string;
  overtimeType: OvertimeType;
}

export interface ZoneConfigDetailResponse {
  id: string;
  nameKey: string;
  subtitleKey: string;
  icon: ZoneIcon;
  activeMonitoring: boolean;
  isPrimary: boolean;
  energyBudget: number;
  energyBudgetMin: number;
  energyBudgetMax: number;
  efficiencyPercent: number;
  criticalTempAlertsEnabled: boolean;
  upperTempLimit: number;
  lowerTempLimit: number;
  alertThreshold?: number;
  alertThresholdIsCold?: boolean;
  schedule: ZoneScheduleResponse;
}

export interface QuickInsightResponse {
  id: string;
  type: InsightType;
  titleKey: string;
  detailKey: string;
}

export interface ConfigAuditEntryResponse {
  id: string;
  timestamp: string;
  modifierName: string;
  modifierType: AuditModifierType;
  modifierInitials?: string;
  actionKey: string;
  zoneKey: string;
  status: AuditStatus;
}

export interface ZoneConfigurationResponse {
  primaryZoneId: string;
  zones: ZoneConfigDetailResponse[];
  globalOptimizerScore: number;
  insights: QuickInsightResponse[];
  auditLog: ConfigAuditEntryResponse[];
}
