import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { DevicesOverview } from '../domain/model/devices-overview.entity';
import { DevicesOverviewAssembler } from './devices-overview-assembler';
import { DevicesOverviewResponse } from './devices-overview-response';

const OVERVIEW_FILE = 'devices-overview';
const OVERVIEW_ID = 1;

export interface DevicesOverviewRefreshResponse {
  refreshed: boolean;
  overview?: DevicesOverviewResponse;
}

@Injectable({ providedIn: 'root' })
export class DevicesOverviewApiService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);

  getOverview(): Observable<DevicesOverview> {
    return this.api
      .getSingleton<DevicesOverviewResponse>(OVERVIEW_FILE, OVERVIEW_ID, OVERVIEW_FILE)
      .pipe(map(dto => DevicesOverviewAssembler.toDomain(dto)));
  }

  refreshOverview(): Observable<DevicesOverviewRefreshResponse> {
    if (!this.api.hasApi()) {
      return of({ refreshed: false });
    }

    return this.http
      .post<DevicesOverviewRefreshResponse>(`${this.baseUrl()}/devices-overview/refresh`, {})
      .pipe(catchError(() => of({ refreshed: false })));
  }

  saveOverview(overview: DevicesOverview): Observable<DevicesOverview> {
    const payload: DevicesOverviewResponse & { id: number } = {
      id: OVERVIEW_ID,
      ...overview,
    };

    return this.api
      .patchSingleton(OVERVIEW_FILE, OVERVIEW_ID, payload, OVERVIEW_FILE)
      .pipe(map(dto => DevicesOverviewAssembler.toDomain(dto)));
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
