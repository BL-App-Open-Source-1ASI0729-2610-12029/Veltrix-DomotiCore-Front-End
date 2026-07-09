import { EnergyIntelligence } from '../domain/model/energy-intelligence.entity';
import { EnergyIntelligenceResponse } from './history-response';

export class HistoryAssembler {
  static toEnergyIntelligence(dto: EnergyIntelligenceResponse): EnergyIntelligence {
    return {
      period: dto.period,
      totalConsumptionKwh: dto.totalConsumptionKwh,
      trendPercent: dto.trendPercent,
      trendDirection: dto.trendDirection,
      trendLabel: dto.trendLabel,
      chartPoints: dto.chartPoints.map(point => ({ ...point })),
      highestConsumer: { ...dto.highestConsumer },
      dailyAverageKwh: dto.dailyAverageKwh,
      dailyAverageLabel: dto.dailyAverageLabel,
      dailyAverageBars: [...dto.dailyAverageBars],
      ecoTip: dto.ecoTip,
      ecoTipKey: dto.ecoTipKey,
      devices: dto.devices.map(device => ({ ...device })),
      savingsSuggestions: (dto.savingsSuggestions ?? []).map(item => ({ ...item })),
      anomalies: (dto.anomalies ?? []).map(item => ({ ...item })),
    };
  }
}
