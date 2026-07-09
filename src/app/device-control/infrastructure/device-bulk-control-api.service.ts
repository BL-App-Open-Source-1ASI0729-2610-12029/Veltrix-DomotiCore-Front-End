import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';

export interface BulkToggleFailure {
  id: string;
  name?: string;
  reason?: string;
}

export interface BulkToggleResponse {
  action: string;
  succeeded?: string[];
  failed?: BulkToggleFailure[];
}

@Injectable({ providedIn: 'root' })
export class DeviceBulkControlApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  hasApi(): boolean {
    return this.api.hasApi();
  }

  bulkToggle(action: 'on' | 'off', includePriority = true): Observable<BulkToggleResponse> {
    if (!this.hasApi()) {
      return of({ action, succeeded: [], failed: [] });
    }

    return this.http
      .post<BulkToggleResponse>(`${this.baseUrl()}/device-details/bulk-toggle`, { action, includePriority })
      .pipe(catchError(() => of({ action, succeeded: [], failed: [] })));
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
