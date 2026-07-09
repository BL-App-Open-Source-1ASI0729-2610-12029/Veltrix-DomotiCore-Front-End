import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { BusinessProfile, DEFAULT_BUSINESS_PROFILE } from '../domain/model/business-profile.entity';
import { BusinessProfileApiService } from '../infrastructure/business-profile-api.service';

@Injectable({ providedIn: 'root' })
export class BusinessProfileStore {
  private readonly api = inject(BusinessProfileApiService);

  readonly profile = signal<BusinessProfile>(structuredClone(DEFAULT_BUSINESS_PROFILE));
  readonly loading = signal(false);
  readonly saving = signal(false);

  load(): Observable<BusinessProfile> {
    this.loading.set(true);
    return this.api.getProfile().pipe(
      tap(profile => this.profile.set(profile)),
      finalize(() => this.loading.set(false)),
    );
  }

  save(profile: BusinessProfile): Observable<BusinessProfile> {
    this.saving.set(true);
    return this.api.updateProfile(profile).pipe(
      tap(saved => this.profile.set(saved)),
      finalize(() => this.saving.set(false)),
    );
  }
}
