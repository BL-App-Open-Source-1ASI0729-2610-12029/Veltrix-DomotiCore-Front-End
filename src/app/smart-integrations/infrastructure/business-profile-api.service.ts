import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { BusinessProfile, DEFAULT_BUSINESS_PROFILE } from '../domain/model/business-profile.entity';

const PROFILE_PATH = 'business-profile';
const MOCK_FILE = 'business-profile';

@Injectable({ providedIn: 'root' })
export class BusinessProfileApiService {
  private readonly api = inject(ApiClientService);

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
