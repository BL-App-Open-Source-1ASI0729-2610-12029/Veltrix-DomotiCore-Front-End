import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { AlertLogEntryResponse, AlertsHistoryResponse } from './alerts-history-response';

const BASE_ENTRIES: AlertLogEntryResponse[] = [
  {
    id: 'log-1',
    priority: 'critical',
    titleKey: 'alertsHistory.events.overConsumption.title',
    detailKey: 'alertsHistory.events.overConsumption.detail',
    locationKey: 'alertsHistory.locations.productionFloor',
    locationIcon: 'factory',
    timestamp: 'Today, 14:22:05',
    status: 'unresolved',
    category: 'alert',
  },
  {
    id: 'log-2',
    priority: 'medium',
    titleKey: 'alertsHistory.events.coldChain.title',
    detailKey: 'alertsHistory.events.coldChain.detail',
    locationKey: 'alertsHistory.locations.coldStorage',
    locationIcon: 'acUnit',
    timestamp: 'Today, 11:08:41',
    status: 'acknowledged',
    category: 'alert',
  },
  {
    id: 'log-3',
    priority: 'low',
    titleKey: 'alertsHistory.events.manualOverride.title',
    detailKey: 'alertsHistory.events.manualOverride.detail',
    locationKey: 'alertsHistory.locations.loadingDock',
    locationIcon: 'localShipping',
    timestamp: 'Yesterday, 23:45:00',
    status: 'investigating',
    category: 'manual',
  },
  {
    id: 'log-4',
    priority: 'low',
    titleKey: 'alertsHistory.events.peakStabilized.title',
    detailKey: 'alertsHistory.events.peakStabilized.detail',
    locationKey: 'alertsHistory.locations.mainOffice',
    locationIcon: 'briefcase',
    timestamp: 'Yesterday, 18:12:33',
    status: 'systemNormal',
    category: 'system',
  },
  {
    id: 'log-5',
    priority: 'critical',
    titleKey: 'alertsHistory.events.sensorOffline.title',
    detailKey: 'alertsHistory.events.sensorOffline.detail',
    locationKey: 'alertsHistory.locations.productionFloor',
    locationIcon: 'factory',
    timestamp: 'Yesterday, 09:30:18',
    status: 'acknowledged',
    category: 'alert',
  },
  {
    id: 'log-6',
    priority: 'medium',
    titleKey: 'alertsHistory.events.energyPeak.title',
    detailKey: 'alertsHistory.events.energyPeak.detail',
    locationKey: 'alertsHistory.locations.kitchen',
    locationIcon: 'refrigerator',
    timestamp: 'Oct 22, 16:55:02',
    status: 'unresolved',
    category: 'alert',
  },
  {
    id: 'log-7',
    priority: 'critical',
    titleKey: 'alertsHistory.events.overConsumption.title',
    detailKey: 'alertsHistory.events.overConsumption.detail',
    locationKey: 'alertsHistory.locations.kitchen',
    locationIcon: 'refrigerator',
    timestamp: 'Today, 08:14:22',
    status: 'unresolved',
    category: 'alert',
  },
  {
    id: 'log-8',
    priority: 'medium',
    titleKey: 'alertsHistory.events.energyPeak.title',
    detailKey: 'alertsHistory.events.energyPeak.detail',
    locationKey: 'alertsHistory.locations.mainOffice',
    locationIcon: 'briefcase',
    timestamp: 'Oct 21, 13:40:11',
    status: 'systemNormal',
    category: 'alert',
  },
  {
    id: 'log-9',
    priority: 'low',
    titleKey: 'alertsHistory.events.manualOverride.title',
    detailKey: 'alertsHistory.events.manualOverride.detail',
    locationKey: 'alertsHistory.locations.loadingDock',
    locationIcon: 'localShipping',
    timestamp: 'Oct 20, 21:05:44',
    status: 'investigating',
    category: 'manual',
  },
  {
    id: 'log-10',
    priority: 'critical',
    titleKey: 'alertsHistory.events.sensorOffline.title',
    detailKey: 'alertsHistory.events.sensorOffline.detail',
    locationKey: 'alertsHistory.locations.coldStorage',
    locationIcon: 'acUnit',
    timestamp: 'Oct 19, 07:18:09',
    status: 'acknowledged',
    category: 'alert',
  },
  {
    id: 'log-11',
    priority: 'medium',
    titleKey: 'alertsHistory.events.coldChain.title',
    detailKey: 'alertsHistory.events.coldChain.detail',
    locationKey: 'alertsHistory.locations.coldStorage',
    locationIcon: 'acUnit',
    timestamp: 'Oct 18, 15:22:57',
    status: 'systemNormal',
    category: 'alert',
  },
  {
    id: 'log-12',
    priority: 'low',
    titleKey: 'alertsHistory.events.peakStabilized.title',
    detailKey: 'alertsHistory.events.peakStabilized.detail',
    locationKey: 'alertsHistory.locations.productionFloor',
    locationIcon: 'factory',
    timestamp: 'Oct 17, 19:01:33',
    status: 'systemNormal',
    category: 'system',
  },
];

const MOCK_ALERTS_HISTORY: AlertsHistoryResponse = {
  summary: {
    criticalAlerts: 12,
    deviceFailures: 4,
    energyPeaks: 28,
    resolutionPercent: 94,
  },
  totalRecords: BASE_ENTRIES.length,
  totalPages: Math.ceil(BASE_ENTRIES.length / 6),
  pageSize: 6,
  entries: BASE_ENTRIES,
  alertFrequency: {
    percent: 64,
    locationKey: 'alertsHistory.locations.productionFloor',
    primaryAlertKey: 'alertsHistory.insights.primaryAlertType',
  },
  meanTimeToResolve: {
    minutes: 12,
    seconds: 45,
    trendPercent: 4.2,
    trendImproved: true,
  },
  systemIntegrity: {
    stabilityPercent: 98,
    statusKey: 'alertsHistory.insights.integrityOptimal',
  },
};

@Injectable({ providedIn: 'root' })
export class AlertsHistoryApiService {
  private readonly api = inject(ApiClientService);

  getAlertsHistory(): Observable<AlertsHistoryResponse> {
    if (this.api.hasApi()) {
      return this.api
        .getObjectWithParams<AlertsHistoryResponse>('alerts-history', {})
        .pipe(catchError(() => this.mockAlertsHistory()));
    }
    return this.mockAlertsHistory();
  }

  private mockAlertsHistory(): Observable<AlertsHistoryResponse> {
    return of(structuredClone(MOCK_ALERTS_HISTORY)).pipe(delay(350));
  }
}
