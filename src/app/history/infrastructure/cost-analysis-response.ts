export type RoiUpgradeStatus = 'approved' | 'review';
export type BillingAuditStatus = 'paid';

export interface BillingBarResponse {
  label: string;
  value: number;
  amount: number;
  peakAmount: number;
  isCurrent?: boolean;
}

export interface AreaEfficiencyResponse {
  id: string;
  nameKey: string;
  icon: string;
  valuePerSqFt: number;
  barPercent: number;
}

export interface RoiUpgradeResponse {
  id: string;
  nameKey: string;
  status: RoiUpgradeStatus;
  paybackMonths: number;
  estimatedSavingsYear1: number;
}

export interface BillingAuditRowResponse {
  id: string;
  period: string;
  baseUsageKwh: number;
  peakDemandKwh: number;
  peakDemandHigh: boolean;
  demandCharge: number;
  taxesAndFees: number;
  netAmount: number;
  status: BillingAuditStatus;
}

export interface CostAnalysisResponse {
  billingCycleLabel: string;
  totalBilling: number;
  billingTrendPercent: number;
  billingBars: BillingBarResponse[];
  peakSurcharge: number;
  peakSurchargePercent: number;
  peakRiskLabelKey: string;
  peakRiskProgress: number;
  strategicSuggestionKey: string;
  areaEfficiencies: AreaEfficiencyResponse[];
  roiUpgrades: RoiUpgradeResponse[];
  billingAudit: BillingAuditRowResponse[];
}
