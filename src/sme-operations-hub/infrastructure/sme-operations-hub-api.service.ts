import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiClientService } from '../../app/shared/services/api-client.service';
import { SmeDateRange } from '../application/sme-operations-hub.store';

export interface OperationsHubSnapshotResponse {
  kpis: unknown[];
  loadBars: unknown[];
  alerts: unknown[];
  deviceStatuses: unknown[];
  facilityZones: unknown[];
  sustainabilityScore: number;
  criticalAlertCount: number;
  highlightedLoadKw: string;
}

@Injectable({ providedIn: 'root' })
export class SmeOperationsHubApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  getSnapshot(range: SmeDateRange): Observable<OperationsHubSnapshotResponse | null> {
    if (!this.api.hasApi()) {
      return of(null);
    }

    const base = environment.apiUrl.replace(/\/$/, '');
    return this.http
      .get<OperationsHubSnapshotResponse>(`${base}/operations-hub/snapshot`, {
        params: { range },
      })
      .pipe(catchError(() => of(null)));
  }
}
