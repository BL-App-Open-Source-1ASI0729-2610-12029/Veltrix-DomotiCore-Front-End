import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { ApiClientService } from '../../app/shared/services/api-client.service';
import { EnergyIntelligence } from '../domain/model/energy-intelligence.entity';
import { EnergyPeriod } from '../domain/model/energy-period.entity';
import { HistoryAssembler } from './history-assembler';
import { EnergyIntelligenceResponse } from './history-response';
import { BusinessReportsResponse, ReportsPeriod } from './business-reports-response';

const SHARED_DEVICES: EnergyIntelligenceResponse['devices'] = [
  { id: 'hvac', name: 'HVAC System', consumptionKwh: 18.4, sharePercent: 43, icon: 'acUnit' },
  { id: 'fridge', name: 'Refrigerator', consumptionKwh: 9.2, sharePercent: 21, icon: 'refrigerator' },
  { id: 'washer', name: 'Washer & Dryer', consumptionKwh: 6.5, sharePercent: 15, icon: 'washer' },
  { id: 'lighting', name: 'Lighting', consumptionKwh: 4.8, sharePercent: 11, icon: 'lightbulb' },
  { id: 'entertainment', name: 'Entertainment', consumptionKwh: 2.1, sharePercent: 5, icon: 'tv' },
  { id: 'other', name: 'Other Devices', consumptionKwh: 1.8, sharePercent: 5, icon: 'moreHoriz' },
];

const SHARED_SAVINGS = [
  {
    id: 'save-thermostat',
    title: 'Lower thermostat by 2°C',
    description: 'Shift HVAC setpoint during peak hours to reduce HVAC load.',
    estimatedSavingKwh: 4.2,
  },
  {
    id: 'save-standby',
    title: 'Disable standby devices overnight',
    description: 'Entertainment and office peripherals still draw power when idle.',
    estimatedSavingKwh: 1.8,
  },
  {
    id: 'save-lighting',
    title: 'Dim non-priority lighting 30%',
    description: 'Apply scene-based dimming in low-traffic areas after 10 PM.',
    estimatedSavingKwh: 0.9,
  },
];

const SHARED_ANOMALIES = [
  {
    id: 'anom-hvac',
    deviceName: 'HVAC System',
    severity: 'high' as const,
    message: 'Consumption 38% above the 7-day average between 2–4 PM.',
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'anom-fridge',
    deviceName: 'Refrigerator',
    severity: 'medium' as const,
    message: 'Compressor cycles are unusually frequent overnight.',
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const MOCK_BY_PERIOD: Record<EnergyPeriod, EnergyIntelligenceResponse> = {
  day: {
    period: 'day',
    totalConsumptionKwh: 6.1,
    trendPercent: 4,
    trendDirection: 'down',
    trendLabel: 'vs yesterday',
    chartPoints: [
      { label: '00:00', value: 0.2 },
      { label: '04:00', value: 0.3 },
      { label: '08:00', value: 0.9 },
      { label: '12:00', value: 1.1 },
      { label: '16:00', value: 1.4 },
      { label: '20:00', value: 1.0 },
      { label: '23:59', value: 0.4 },
    ],
    highestConsumer: {
      name: 'HVAC System',
      consumptionKwh: 2.6,
      sharePercent: 43,
      icon: 'acUnit',
    },
    dailyAverageKwh: 6.1,
    dailyAverageLabel: 'Stable vs last 30 days',
    dailyAverageBars: [42, 55, 48, 62, 58, 70, 65],
    ecoTip: 'Lowering your thermostat by just 2°C could save you 0.6 kWh today.',
    devices: SHARED_DEVICES.map(device => ({
      ...device,
      consumptionKwh: +(device.consumptionKwh / 7).toFixed(1),
    })),
    savingsSuggestions: SHARED_SAVINGS.map(item => ({
      ...item,
      estimatedSavingKwh: +(item.estimatedSavingKwh / 7).toFixed(1),
    })),
    anomalies: SHARED_ANOMALIES,
  },
  week: {
    period: 'week',
    totalConsumptionKwh: 42.8,
    trendPercent: 12,
    trendDirection: 'down',
    trendLabel: 'vs last week',
    chartPoints: [
      { label: 'Mon', value: 5.4 },
      { label: 'Tue', value: 6.3 },
      { label: 'Wed', value: 5.7 },
      { label: 'Thu', value: 7.1 },
      { label: 'Fri', value: 6.0 },
      { label: 'Sat', value: 5.5 },
      { label: 'Sun', value: 6.8 },
    ],
    highestConsumer: {
      name: 'HVAC System',
      consumptionKwh: 18.4,
      sharePercent: 43,
      icon: 'acUnit',
    },
    dailyAverageKwh: 6.1,
    dailyAverageLabel: 'Stable vs last 30 days',
    dailyAverageBars: [42, 55, 48, 62, 58, 70, 65],
    ecoTip: 'Lowering your thermostat by just 2°C could save you 4.2 kWh this week.',
    devices: SHARED_DEVICES,
    savingsSuggestions: SHARED_SAVINGS,
    anomalies: SHARED_ANOMALIES,
  },
  month: {
    period: 'month',
    totalConsumptionKwh: 184.2,
    trendPercent: 8,
    trendDirection: 'down',
    trendLabel: 'vs last month',
    chartPoints: [
      { label: 'W1', value: 41.2 },
      { label: 'W2', value: 44.8 },
      { label: 'W3', value: 46.1 },
      { label: 'W4', value: 52.1 },
    ],
    highestConsumer: {
      name: 'HVAC System',
      consumptionKwh: 79.2,
      sharePercent: 43,
      icon: 'acUnit',
    },
    dailyAverageKwh: 6.1,
    dailyAverageLabel: 'Stable vs last 30 days',
    dailyAverageBars: [38, 52, 46, 60, 55, 68, 62],
    ecoTip: 'Lowering your thermostat by just 2°C could save you 18.4 kWh this month.',
    devices: SHARED_DEVICES.map(device => ({
      ...device,
      consumptionKwh: +(device.consumptionKwh * 4.3).toFixed(1),
    })),
    savingsSuggestions: SHARED_SAVINGS.map(item => ({
      ...item,
      estimatedSavingKwh: +(item.estimatedSavingKwh * 4.3).toFixed(1),
    })),
    anomalies: SHARED_ANOMALIES,
  },
};

const MOCK_BUSINESS_REPORTS: BusinessReportsResponse = {
  efficiencyGoalPercent: 75,
  efficiencyLabelKey: 'businessReports.efficiency.optimal',
  efficiencyComparisonKey: 'businessReports.efficiency.comparison',
  weeklyChart: [
    { label: 'MON', value: 920 },
    { label: 'TUE', value: 1040 },
    { label: 'WED', value: 980 },
    { label: 'THU', value: 1120 },
    { label: 'FRI', value: 1010 },
    { label: 'SAT', value: 760 },
    { label: 'SUN', value: 690 },
  ],
  monthlyChart: [
    { label: 'W1', value: 4200 },
    { label: 'W2', value: 4680 },
    { label: 'W3', value: 4510 },
    { label: 'W4', value: 4890 },
  ],
  zones: [
    { id: 'z1', name: 'East Wing Production', usageKwh: 4280 },
    { id: 'z2', name: 'Data Center Hub', usageKwh: 3150 },
    { id: 'z3', name: 'Corporate Offices', usageKwh: 1820 },
    { id: 'z4', name: 'Storage & Logistics', usageKwh: 940 },
  ],
  peakAlert: {
    titleKey: 'businessReports.peak.title',
    timeLabel: 'Today, 2:30 PM',
    messageKey: 'businessReports.peak.message',
  },
  devices: [
    {
      id: 'd1',
      name: 'HVAC System A1',
      sublabelKey: 'businessReports.devices.hvacSublabel',
      zone: 'Production Wing',
      consumptionKwh: 820,
      trendPercent: 4.2,
      trend: 'up',
      status: 'OPTIMAL',
      icon: 'acUnit',
    },
    {
      id: 'd2',
      name: 'Smart Lighting Hub',
      sublabelKey: 'businessReports.devices.lightingSublabel',
      zone: 'Corporate Offices',
      consumptionKwh: 215,
      trendPercent: 12.5,
      trend: 'down',
      status: 'STEADY',
      icon: 'lightbulb',
    },
    {
      id: 'd3',
      name: 'Server Rack S3',
      sublabelKey: 'businessReports.devices.serverSublabel',
      zone: 'Data Center Hub',
      consumptionKwh: 1450,
      trendPercent: 0,
      trend: 'stable',
      status: 'STEADY',
      icon: 'dns',
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class HistoryApiService {
  private readonly api = inject(ApiClientService);

  getEnergyIntelligence(period: EnergyPeriod): Observable<EnergyIntelligence> {
    if (this.api.hasApi()) {
      return this.api
        .getObjectWithParams<EnergyIntelligenceResponse>('energy-intelligence', { period })
        .pipe(
          map(HistoryAssembler.toEnergyIntelligence),
          catchError(() => this.mockEnergyIntelligence(period)),
        );
    }
    return this.mockEnergyIntelligence(period);
  }

  getBusinessReports(period: ReportsPeriod = 'thisMonth'): Observable<BusinessReportsResponse> {
    if (this.api.hasApi()) {
      return this.api
        .getObjectWithParams<BusinessReportsResponse>('business-reports', { range: period })
        .pipe(catchError(() => this.mockBusinessReports(period)));
    }
    return this.mockBusinessReports(period);
  }

  private mockEnergyIntelligence(period: EnergyPeriod): Observable<EnergyIntelligence> {
    return of(HistoryAssembler.toEnergyIntelligence(MOCK_BY_PERIOD[period])).pipe(delay(250));
  }

  private mockBusinessReports(period: ReportsPeriod): Observable<BusinessReportsResponse> {
    const scale = period === 'thisMonth' ? 1 : period === 'lastMonth' ? 0.92 : 1.08;
    const peakLabel = period === 'thisMonth'
      ? 'Today, 2:30 PM'
      : period === 'lastMonth'
        ? 'Sep 28, 3:15 PM'
        : 'Q4 Peak, 1:45 PM';

    const scaled: BusinessReportsResponse = {
      ...MOCK_BUSINESS_REPORTS,
      efficiencyGoalPercent: Math.min(99, Math.round(MOCK_BUSINESS_REPORTS.efficiencyGoalPercent * scale)),
      weeklyChart: MOCK_BUSINESS_REPORTS.weeklyChart.map(point => ({
        ...point,
        value: Math.round(point.value * scale),
      })),
      monthlyChart: MOCK_BUSINESS_REPORTS.monthlyChart.map(point => ({
        ...point,
        value: Math.round(point.value * scale),
      })),
      zones: MOCK_BUSINESS_REPORTS.zones.map(zone => ({
        ...zone,
        usageKwh: Math.round(zone.usageKwh * scale),
      })),
      devices: MOCK_BUSINESS_REPORTS.devices.map(device => ({
        ...device,
        consumptionKwh: Math.round(device.consumptionKwh * scale),
      })),
      peakAlert: {
        ...MOCK_BUSINESS_REPORTS.peakAlert,
        timeLabel: peakLabel,
      },
    };

    return of(scaled).pipe(delay(250));
  }
}
