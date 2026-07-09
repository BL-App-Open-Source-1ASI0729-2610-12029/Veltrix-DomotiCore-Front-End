import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { AlertEntity } from '../domain/model/alert.entity';
import { DeviceEntity } from '../domain/model/device.entity';
import { StatisticEntity } from '../domain/model/statistic.entity';
import { EnergyData } from '../application/dashboard.store';

export interface DashboardResponse {
  segment?: string;
  statistics?: StatisticEntity[];
  alerts?: AlertEntity[];
  devices?: DeviceEntity[];
  energyData?: Record<string, EnergyData>;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  getDashboard(): Observable<DashboardResponse> {
    if (!this.api.hasApi()) {
      return of({});
    }

    return this.http
      .get<DashboardResponse>(`${this.baseUrl()}/dashboard`)
      .pipe(catchError(() => of({})));
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
