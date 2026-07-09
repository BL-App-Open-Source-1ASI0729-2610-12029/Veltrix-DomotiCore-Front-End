import { Injectable, inject, signal } from '@angular/core';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsApiService } from '../infrastructure/settings-api.service';

export const DEFAULT_PROFILE_PHOTO = 'assets/icons/shared/profile-admin.jpg';

export interface SettingsState {
  fullName: string;
  email: string;
  homeZone: string;
  homeZoneKey?: string;
  displayMode: 'light' | 'dark';
  profilePhoto?: string;
  twoFactorEnabled: boolean;
  googleConnected: boolean;
  appleKitConnected: boolean;
  nestConnected: boolean;
  roleKey?: string;
  jobTitleKey?: string;
  dataRetentionDays?: number;
  passwordUpdatedAt?: string;
  pgeUtilityConnected?: boolean;
  grafanaIntegrationConnected?: boolean;
  sapErpConnected?: boolean;
  energyAlertsEnabled?: boolean;
  deviceFailureAlertsEnabled?: boolean;
  weeklyReportEmailsEnabled?: boolean;
  timezone?: string;
  sessionTimeoutMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly api = inject(SettingsApiService);
  private readonly theme = inject(ThemeService);

  readonly settings = signal<SettingsState>({
    fullName: 'Alexander Domotic',
    email: 'alexander@domoticore.io',
    homeZone: 'Headquarters / Palo Alto Campus',
    homeZoneKey: 'settings.business.facilities.headquarters',
    displayMode: 'light',
    profilePhoto: DEFAULT_PROFILE_PHOTO,
    twoFactorEnabled: true,
    googleConnected: true,
    appleKitConnected: false,
    nestConnected: true,
    roleKey: 'settings.administrator',
    jobTitleKey: 'settings.systemOwner',
    dataRetentionDays: 365,
    passwordUpdatedAt: '2026-03-01T00:00:00.000Z',
    pgeUtilityConnected: true,
    grafanaIntegrationConnected: true,
    sapErpConnected: true,
    energyAlertsEnabled: true,
    deviceFailureAlertsEnabled: true,
    weeklyReportEmailsEnabled: false,
    timezone: 'America/Los_Angeles',
    sessionTimeoutMinutes: 60,
  });

  readonly loading = signal(false);
  readonly saving = signal(false);

  reset(): void {
    this.settings.set({
      fullName: '',
      email: '',
      homeZone: '',
      displayMode: 'light',
      profilePhoto: DEFAULT_PROFILE_PHOTO,
      twoFactorEnabled: false,
      googleConnected: false,
      appleKitConnected: false,
      nestConnected: false,
    });
    this.loading.set(false);
    this.saving.set(false);
  }

  fetchSettings(): void {
    this.loading.set(true);

    this.api.getProfile().subscribe({
      next: profile => {
        const { id: _id, ...state } = profile;
        this.settings.set({
          ...state,
          profilePhoto: state.profilePhoto || DEFAULT_PROFILE_PHOTO,
        });
        this.theme.apply(state.displayMode);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  async saveSettings(newSettings: Partial<SettingsState>): Promise<boolean> {
    this.saving.set(true);

    const previous = this.settings();
    const merged = { ...previous, ...newSettings };
    this.settings.set(merged);
    this.theme.apply(merged.displayMode);

    return new Promise<boolean>(resolve => {
      this.api.updateProfile({ ...merged }).subscribe({
        next: saved => {
          const { id: _id, ...state } = saved;
          this.settings.set(state);
          this.saving.set(false);
          resolve(true);
        },
        error: () => {
          this.settings.set(previous);
          this.theme.apply(previous.displayMode);
          this.saving.set(false);
          resolve(false);
        },
      });
    });
  }

  saveDisplayMode(mode: 'light' | 'dark'): void {
    const updated = { ...this.settings(), displayMode: mode };
    this.settings.set(updated);
    this.theme.apply(mode);
    this.api.updateProfile({ ...updated }).subscribe();
  }

  getProfilePhoto(): string {
    return this.settings().profilePhoto || DEFAULT_PROFILE_PHOTO;
  }
}
