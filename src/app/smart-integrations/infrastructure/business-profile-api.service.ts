import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { BusinessProfile, DEFAULT_BUSINESS_PROFILE } from '../domain/model/business-profile.entity';

const PROFILE_PATH = 'business-profile';
const MOCK_FILE = 'business-profile';

@Injectable({ providedIn: 'root' })
export class BusinessProfileApiService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);

  getProfile(): Observable<BusinessProfile> {
    return this.api.getObject<BusinessProfile>(PROFILE_PATH, MOCK_FILE).pipe(
      map(profile => this.normalize(profile)),
      catchError(() => of(structuredClone(DEFAULT_BUSINESS_PROFILE))),
    );
  }

  updateProfile(profile: BusinessProfile): Observable<BusinessProfile> {
    return this.api.patchObject<BusinessProfile>(PROFILE_PATH, profile, MOCK_FILE).pipe(
      map(updated => this.normalize(updated)),
      catchError(() => of(structuredClone(profile))),
    );
  }

  regenerateApiKey(): Observable<BusinessProfile> {
    if (!this.api.hasApi()) {
      const profile = structuredClone(DEFAULT_BUSINESS_PROFILE);
      profile.apiKey = `dc_live_${Math.random().toString(36).slice(2, 10)}_regenerated`;
      return of(profile);
    }

    return this.http
      .post<BusinessProfile>(`${this.baseUrl()}/business-profile/regenerate-api-key`, {})
      .pipe(
        map(updated => this.normalize(updated)),
        catchError(() => of(structuredClone(DEFAULT_BUSINESS_PROFILE))),
      );
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }

  private normalize(profile: BusinessProfile): BusinessProfile {
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      ...profile,
      provider: { ...DEFAULT_BUSINESS_PROFILE.provider, ...profile.provider },
      documents: profile.documents ?? DEFAULT_BUSINESS_PROFILE.documents,
      webhooks: profile.webhooks ?? DEFAULT_BUSINESS_PROFILE.webhooks,
    };
  }
}
