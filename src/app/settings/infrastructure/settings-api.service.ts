import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../shared/services/api-client.service';
import { SettingsState } from '../application/settings.store';

export interface UserProfileResponse extends SettingsState {
  id?: number;
  roleKey?: string;
  jobTitleKey?: string;
}

const PROFILE_PATH = 'user-profile/me';
const MOCK_FILE = 'user-profile';

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly api = inject(ApiClientService);

  getProfile(): Observable<UserProfileResponse> {
    return this.api.getObject<UserProfileResponse>(PROFILE_PATH, MOCK_FILE);
  }

  updateProfile(profile: UserProfileResponse): Observable<UserProfileResponse> {
    return this.api.patchObject<UserProfileResponse>(PROFILE_PATH, profile, MOCK_FILE);
  }
}
