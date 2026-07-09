import { ConsumptionDataPoint } from './consumption-data-point.entity';
import { DeviceConsumption } from './device-consumption.entity';
import { EnergyPeriod } from './energy-period.entity';

export interface SavingsSuggestion {
  id: string;
  title: string;
  description: string;
  titleKey?: string;
  descriptionKey?: string;
  estimatedSavingKwh: number;
}

export interface ConsumptionAnomaly {
  id: string;
  deviceName: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: string;
}

export interface EnergyIntelligence {
  period: EnergyPeriod;
  totalConsumptionKwh: number;
  trendPercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendLabel: string;
  chartPoints: ConsumptionDataPoint[];
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
  devices: DeviceConsumption[];
  savingsSuggestions: SavingsSuggestion[];
  anomalies: ConsumptionAnomaly[];
}
