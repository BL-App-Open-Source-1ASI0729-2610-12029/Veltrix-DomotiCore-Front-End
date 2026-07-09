import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';

export interface DeveloperTokenValidation {
  valid: boolean;
  accountEmail?: string;
  segment?: string;
}

export interface DeveloperDeviceStatus {
  id: string;
  name: string;
  type?: string;
  active: boolean;
  connection: string;
  batteryPercent?: number;
  powerUsageW?: number;
  lastUpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class DeveloperApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  hasApi(): boolean {
    return this.api.hasApi();
  }

  validateToken(): Observable<DeveloperTokenValidation> {
    if (!this.hasApi()) {
      return of({ valid: false });
    }

    return this.http
      .post<DeveloperTokenValidation>(`${this.baseUrl()}/developer/auth/validate`, {})
      .pipe(catchError(() => of({ valid: false })));
  }

  listDevices(): Observable<DeveloperDeviceStatus[]> {
    if (!this.hasApi()) {
      return of([]);
    }

    return this.http
      .get<DeveloperDeviceStatus[]>(`${this.baseUrl()}/developer/devices`)
      .pipe(catchError(() => of([])));
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
