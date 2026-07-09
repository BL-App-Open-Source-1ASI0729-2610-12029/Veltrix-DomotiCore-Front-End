import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { ZoneConfigurationResponse } from './zone-configuration-response';

const CONFIG_PATH = 'zone-configuration';
const MOCK_FILE = 'zone-configuration';

const FALLBACK: ZoneConfigurationResponse = {
  primaryZoneId: 'main-office',
  zones: [],
  globalOptimizerScore: 0,
  insights: [],
  auditLog: [],
};

@Injectable({ providedIn: 'root' })
export class ZoneConfigurationApiService {
  private readonly api = inject(ApiClientService);

  getZoneConfiguration(): Observable<ZoneConfigurationResponse> {
    return this.api.getObject<ZoneConfigurationResponse>(CONFIG_PATH, MOCK_FILE).pipe(
      catchError(() => of(structuredClone(FALLBACK))),
    );
  }

  saveZoneConfiguration(payload: ZoneConfigurationResponse): Observable<ZoneConfigurationResponse> {
    return this.api.patchObject<ZoneConfigurationResponse>(CONFIG_PATH, payload, MOCK_FILE).pipe(
      catchError(() => of(structuredClone(payload))),
    );
  }
}
