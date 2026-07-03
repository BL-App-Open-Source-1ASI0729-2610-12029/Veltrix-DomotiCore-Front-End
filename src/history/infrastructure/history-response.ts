import { EnergyPeriod } from '../domain/model/energy-period.entity';

export interface ConsumptionDataPointResponse {
  label: string;
  value: number;
}

export interface DeviceConsumptionResponse {
  id: string;
  name: string;
  consumptionKwh: number;
  sharePercent: number;
  icon: string;
}

export interface EnergyIntelligenceResponse {
  period: EnergyPeriod;
  totalConsumptionKwh: number;
  trendPercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendLabel: string;
  chartPoints: ConsumptionDataPointResponse[];
  highestConsumer: {
    name: string;
    consumptionKwh: number;
    sharePercent: number;
    icon: string;
  };
  dailyAverageKwh: number;
  dailyAverageLabel: string;
  dailyAverageBars: number[];
  ecoTip: string;
  devices: DeviceConsumptionResponse[];
  savingsSuggestions?: SavingsSuggestionResponse[];
  anomalies?: ConsumptionAnomalyResponse[];
}

export interface SavingsSuggestionResponse {
  id: string;
  title: string;
  description: string;
  estimatedSavingKwh: number;
}

export interface ConsumptionAnomalyResponse {
  id: string;
  deviceName: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: string;
}
