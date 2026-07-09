import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';

export interface ConnectedIntegration {
  id: string;
  nameKey?: string;
  name?: string;
  provider?: string;
  connected: boolean;
  status: string;
}

export interface IntegrationSchedule {
  id: string;
  integrationId: string;
  deviceName: string;
  onTime: string;
  offTime: string;
  enabled: boolean;
  timezone?: string;
}

export interface IntegrationsData {
  id?: string;
  connectedIntegrations?: ConnectedIntegration[];
  schedules?: IntegrationSchedule[];
  compatibilityCatalog?: Array<{
    model: string;
    type: string;
    compatible: boolean;
  }>;
}

export interface CompatibilityCheckResult {
  compatible: boolean;
  messageKey?: string;
  modelOrType?: string;
  matchedModel?: string;
  matchedType?: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrationsApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  hasApi(): boolean {
    return this.api.hasApi();
  }

  getIntegrations(): Observable<IntegrationsData> {
    if (!this.hasApi()) {
      return of({});
    }

    return this.http
      .get<IntegrationsData>(`${this.baseUrl()}/integrations`)
      .pipe(catchError(() => of({})));
  }

  patchIntegrations(patch: Partial<IntegrationsData>): Observable<IntegrationsData> {
    if (!this.hasApi()) {
      return of(patch as IntegrationsData);
    }

    return this.http
      .patch<IntegrationsData>(`${this.baseUrl()}/integrations`, patch)
      .pipe(catchError(() => of(patch as IntegrationsData)));
  }

  checkCompatibility(modelOrType: string): Observable<CompatibilityCheckResult> {
    if (!this.hasApi()) {
      return of({ compatible: false, messageKey: 'integrations.compatibility.notFound' });
    }

    return this.http
      .post<CompatibilityCheckResult>(`${this.baseUrl()}/integrations/compatibility-check`, { modelOrType })
      .pipe(catchError(() => of({ compatible: false, messageKey: 'integrations.compatibility.notFound' })));
  }

  createSchedule(schedule: Omit<IntegrationSchedule, 'id'> & { id?: string }): Observable<IntegrationsData> {
    if (!this.hasApi()) {
      return of({ schedules: [schedule as IntegrationSchedule] });
    }

    return this.http
      .post<IntegrationsData>(`${this.baseUrl()}/integrations/schedules`, schedule)
      .pipe(catchError(() => of({ schedules: [schedule as IntegrationSchedule] })));
  }

  updateSchedule(id: string, patch: Partial<IntegrationSchedule>): Observable<IntegrationsData> {
    if (!this.hasApi()) {
      return of({ schedules: [{ id, ...patch } as IntegrationSchedule] });
    }

    return this.http
      .patch<IntegrationsData>(`${this.baseUrl()}/integrations/schedules/${id}`, patch)
      .pipe(catchError(() => of({ schedules: [{ id, ...patch } as IntegrationSchedule] })));
  }

  deleteSchedule(id: string): Observable<void> {
    if (!this.hasApi()) {
      return of(undefined);
    }

    return this.http
      .delete<void>(`${this.baseUrl()}/integrations/schedules/${id}`)
      .pipe(catchError(() => of(undefined)));
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
