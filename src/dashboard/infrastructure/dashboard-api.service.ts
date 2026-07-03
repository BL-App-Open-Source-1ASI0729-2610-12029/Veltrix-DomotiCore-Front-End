import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AlertEntity } from '../domain/model/alert.entity';
import { DeviceEntity } from '../domain/model/device.entity';
import { StatisticEntity } from '../domain/model/statistic.entity';
import { DashboardStore, EnergyData } from '../application/dashboard.store';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  constructor(private readonly dashboardStore: DashboardStore) {}

  getStatistics(): Observable<StatisticEntity[]> {
    return of(this.dashboardStore.statistics()).pipe(delay(80));
  }

  getAlerts(): Observable<AlertEntity[]> {
    return of(this.dashboardStore.alerts()).pipe(delay(80));
  }

  getDevices(): Observable<DeviceEntity[]> {
    return of(this.dashboardStore.devices()).pipe(delay(80));
  }

  getEnergyData(range: string): Observable<EnergyData | undefined> {
    return of(this.dashboardStore.energyData()[range]).pipe(delay(80));
  }
}
