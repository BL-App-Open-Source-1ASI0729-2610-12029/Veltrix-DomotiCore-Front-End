import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { BusinessDevicesOverviewResponse } from './business-devices-response';

const MOCK_OVERVIEW: BusinessDevicesOverviewResponse = {
  activeDeviceCount: 42,
  zoneCount: 3,
  totalConsumptionKw: 14.2,
  zones: [
    {
      id: 'office',
      name: 'Office Zone',
      deviceCount: 12,
      layout: 'cards',
      ecoPromoKey: 'businessDevices.zones.office.ecoPromo',
      ecoPromoCtaKey: 'businessDevices.zones.office.ecoCta',
      cards: [
        {
          id: 'ac-main',
          name: 'Main AC Unit',
          icon: 'acUnit',
          status: 'active',
          active: true,
          loadKw: 2.4,
          metricLabel: '22°C',
        },
        {
          id: 'lights-overhead',
          name: 'Overhead Lighting',
          icon: 'lightbulb',
          status: 'active',
          active: true,
          loadKw: 0.8,
          metricLabel: '80%',
        },
        {
          id: 'server-rack-b',
          name: 'Server Rack B',
          icon: 'dns',
          status: 'offline',
          active: false,
          loadKw: 0,
          metricLabel: 'Offline',
        },
      ],
    },
    {
      id: 'warehouse',
      name: 'Warehouse',
      deviceCount: 24,
      layout: 'table',
      viewAllCount: 24,
      tableRows: [
        {
          id: 'charger-04',
          name: 'Charger Station 04',
          status: 'ACTIVE',
          loadKw: 5.2,
          active: true,
        },
        {
          id: 'belt-a',
          name: 'Sortation Belt A',
          status: 'ACTIVE',
          loadKw: 3.8,
          active: true,
        },
        {
          id: 'fan-02',
          name: 'Industrial Fan 02',
          status: 'STANDBY',
          loadKw: 0.2,
          active: false,
        },
      ],
    },
    {
      id: 'retail',
      name: 'Retail Floor',
      deviceCount: 20,
      layout: 'mixed',
      lightingGroup: {
        active: true,
        activeUnits: 18,
        totalUnits: 20,
        efficiencyPercent: 94,
        chartBars: [42, 58, 52, 70, 64, 78, 72, 68],
      },
      environment: {
        imageUrl: 'assets/icons/shared/automation-house-dusk.jpg',
        airQualityLabelKey: 'businessDevices.environment.excellent',
        aqi: 12,
        temperatureC: 22.4,
      },
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class BusinessDevicesApiService {
  private readonly api = inject(ApiClientService);

  getOverview(): Observable<BusinessDevicesOverviewResponse> {
    if (this.api.hasApi()) {
      return this.api
        .getObjectWithParams<BusinessDevicesOverviewResponse>('business-devices/overview', {})
        .pipe(catchError(() => this.mockOverview()));
    }
    return this.mockOverview();
  }

  private mockOverview(): Observable<BusinessDevicesOverviewResponse> {
    return of(structuredClone(MOCK_OVERVIEW)).pipe(delay(250));
  }
}
