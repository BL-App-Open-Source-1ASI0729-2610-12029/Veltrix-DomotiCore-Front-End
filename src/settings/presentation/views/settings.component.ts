import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DEFAULT_PROFILE_PHOTO,
  SettingsState,
  SettingsStore,
} from '../../application/settings.store';
import { GOOGLE_ICONS } from '../../../app/shared/constants/google-icons';
import { ThemeService } from '../../../app/shared/services/theme.service';
import { UiFeedbackService } from '../../../app/shared/services/ui-feedback.service';
import { SecurityStore } from '../../../security/application/security.store';
import { AuthorizedUser } from '../../../security/domain/model/authorized-user.entity';
import { AccessLevel } from '../../../security/infrastructure/security-response';
import { AuthService } from '../../../app/iam/application/auth.service';
import { RolePermissionService } from '../../../app/iam/application/role-permission.service';
import { LocalAuthRepository } from '../../../app/iam/infrastructure/local-auth.repository';
import { downloadTextFile } from '../../../app/shared/utils/download-file.util';
import { MATERIAL_IMPORTS } from '../../../app/shared/material';

interface RetentionOption {
  days: number;
  labelKey: string;
}

interface ConnectionItem {
  nameKey: string;
  icon: string;
  status: boolean;
  field: keyof SettingsState;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  private readonly settingsStore = inject(SettingsStore);
  private readonly securityStore = inject(SecurityStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly authRepository = inject(LocalAuthRepository);
  private readonly permissions = inject(RolePermissionService);

  readonly settings = this.settingsStore.settings;
  readonly loading = this.settingsStore.loading;
  readonly saving = this.settingsStore.saving;
  readonly authorizedUsers = this.securityStore.authorizedUsers;

  readonly isBusinessMode = computed(() => this.auth.getEffectiveAccountType() === 'small-business');

  readonly visibleTabs = computed(() =>
    this.tabItems.filter(tab => {
      if (tab.id === 'profile') return true;
      if (tab.id === 'access') return this.permissions.canManageAuthorizedUsers();
      if (tab.id === 'privacy') return this.permissions.canAccessSystemSettings();
      if (tab.id === 'devices') {
        return this.permissions.canManageIntegrations() || !this.isBusinessMode();
      }
      if (tab.id === 'system') return this.permissions.canAccessSystemSettings();
      return true;
    }),
  );

  activeTab: 'profile' | 'access' | 'privacy' | 'devices' | 'system' = 'profile';
  formData: SettingsState = { ...this.settings() };
  saved = false;
  dirty = false;
  profileLocked = true;
  showPasswordModal = false;
  showRetentionModal = false;
  showUserActionsModal = false;
  showGrantAccessModal = false;
  showTwoFactorModal = false;
  selectedUser: AuthorizedUser | null = null;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  grantAccessName = '';
  grantAccessEmail = '';
  grantAccessLevel: AccessLevel = 'guest';
  twoFactorCode = '';

  readonly icons = GOOGLE_ICONS;
  readonly defaultProfilePhoto = DEFAULT_PROFILE_PHOTO;
  readonly accessLevels: AccessLevel[] = ['admin', 'member', 'guest'];
  readonly userTableColumns = ['user', 'accessLevel', 'lastEntry', 'actions'];

  readonly homeZoneOptions = [
    'settings.homeZones.northWing',
    'settings.homeZones.southWing',
    'settings.homeZones.garage',
  ];

  readonly businessFacilityOptions = [
    'settings.business.facilities.headquarters',
    'settings.business.facilities.warehouseNorth',
    'settings.business.facilities.retailFloor',
  ];

  readonly retentionOptions: RetentionOption[] = [
    { days: 30, labelKey: 'settings.retention.30days' },
    { days: 90, labelKey: 'settings.retention.90days' },
    { days: 365, labelKey: 'settings.retention.1year' },
    { days: -1, labelKey: 'settings.retention.forever' },
  ];

  readonly timezoneOptions = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/Madrid',
    'UTC',
  ];

  readonly sessionTimeoutOptions = [15, 30, 60, 120];

  readonly tabItems = [
    { id: 'profile' as const, labelKey: 'settings.tabs.profile', icon: GOOGLE_ICONS.person },
    { id: 'access' as const, labelKey: 'settings.tabs.access', icon: GOOGLE_ICONS.shield },
    { id: 'privacy' as const, labelKey: 'settings.tabs.privacy', icon: GOOGLE_ICONS.security },
    { id: 'devices' as const, labelKey: 'settings.tabs.devices', icon: GOOGLE_ICONS.devices },
    { id: 'system' as const, labelKey: 'settings.tabs.system', icon: GOOGLE_ICONS.settings },
  ];

  homeZoneKey = 'settings.business.facilities.headquarters';
  connections: ConnectionItem[] = [];

  constructor() {
    effect(() => {
      const current = this.settings();
      if (!this.dirty) {
        this.formData = { ...current };
        this.homeZoneKey = current.homeZoneKey ?? this.zoneOptions()[0];
        this.syncConnectionsFromForm();
      }
    });
  }

  ngOnInit(): void {
    this.settingsStore.fetchSettings();
    if (this.permissions.canManageAuthorizedUsers()) {
      this.securityStore.loadAuthorizedUsers();
    }

    const allowedTabs = this.visibleTabs().map(tab => tab.id);
    if (!allowedTabs.includes(this.activeTab)) {
      this.activeTab = 'profile';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showPasswordModal) this.closeChangePassword();
    if (this.showRetentionModal) this.closeRetentionModal();
    if (this.showUserActionsModal) this.closeUserActions();
    if (this.showGrantAccessModal) this.closeGrantAccessModal();
    if (this.showTwoFactorModal) this.closeTwoFactorModal();
  }

  zoneOptions(): string[] {
    return this.businessFacilityOptions;
  }

  zoneLabelKey(): string {
    return 'settings.primaryFacility';
  }

  profilePhotoDescriptionKey(): string {
    return 'settings.business.profilePhotoDescription';
  }

  subtitleKey(): string {
    return this.isBusinessMode() ? 'settings.business.subtitle' : 'settings.subtitle';
  }

  devicesTabLabelKey(): string {
    return this.isBusinessMode() ? 'settings.tabs.integrations' : 'settings.tabs.devices';
  }

  tabLabelKey(tabId: string, defaultKey: string): string {
    return tabId === 'devices' ? this.devicesTabLabelKey() : defaultKey;
  }

  connectionsTitleKey(): string {
    return this.isBusinessMode() ? 'settings.business.integrationsTitle' : 'settings.connections';
  }

  connectionsDescriptionKey(): string {
    return this.isBusinessMode()
      ? 'settings.business.integrationsDescription'
      : 'settings.connectionsDescription';
  }

  manageHubsLabelKey(): string {
    return this.isBusinessMode()
      ? 'settings.business.manageIntegrations'
      : 'settings.manageAllHubs';
  }

  get profilePhotoUrl(): string {
    return this.formData.profilePhoto || this.defaultProfilePhoto;
  }

  get retentionLabelKey(): string {
    const days = this.formData.dataRetentionDays ?? 365;
    const match = this.retentionOptions.find(option => option.days === days);
    return match?.labelKey ?? 'settings.retention.1year';
  }

  get passwordLastUpdatedLabel(): string {
    const updatedAt = this.formData.passwordUpdatedAt;
    if (!updatedAt) {
      return this.translate.instant('settings.passwordLastUpdatedDefault');
    }

    const updated = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays < 30) {
      return this.translate.instant('settings.passwordLastUpdatedDays', { days: diffDays });
    }

    const diffMonths = Math.max(1, Math.floor(diffDays / 30));
    return this.translate.instant('settings.passwordLastUpdatedMonths', { months: diffMonths });
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  selectTab(tabId: string): void {
    if (tabId === 'profile' || tabId === 'access' || tabId === 'privacy' || tabId === 'devices' || tabId === 'system') {
      this.activeTab = tabId;
    }
  }

  updateField(field: keyof SettingsState, value: SettingsState[keyof SettingsState]): void {
    this.formData = { ...this.formData, [field]: value };
    this.dirty = true;
  }

  setHomeZone(labelKey: string): void {
    this.homeZoneKey = labelKey;
    this.formData = {
      ...this.formData,
      homeZoneKey: labelKey,
      homeZone: this.translate.instant(labelKey),
    };
    this.dirty = true;
    this.feedback.showToast(
      this.translate.instant('settings.toast.facilityUpdated', {
        zone: this.translate.instant(labelKey),
      }),
      'info',
    );
  }

  setDisplayMode(mode: 'light' | 'dark'): void {
    if (this.formData.displayMode === mode) return;
    this.formData = { ...this.formData, displayMode: mode };
    this.settingsStore.saveDisplayMode(mode);
    this.feedback.showToast(
      this.translate.instant('settings.toast.displayModeChanged', {
        mode: this.translate.instant(mode === 'light' ? 'settings.lightMode' : 'settings.darkMode'),
      }),
      'info',
    );
  }

  toggleTwoFactor(): void {
    if (this.formData.twoFactorEnabled) {
      this.updateField('twoFactorEnabled', false);
      this.feedback.showToast(this.translate.instant('settings.toast.twoFactorDisabled'), 'info');
      return;
    }

    this.twoFactorCode = '';
    this.showTwoFactorModal = true;
  }

  closeTwoFactorModal(): void {
    this.showTwoFactorModal = false;
    this.twoFactorCode = '';
  }

  confirmTwoFactor(): void {
    if (!/^\d{6}$/.test(this.twoFactorCode.trim())) {
      this.feedback.showToast(this.translate.instant('settings.toast.twoFactorCodeInvalid'), 'warning');
      return;
    }

    this.updateField('twoFactorEnabled', true);
    this.closeTwoFactorModal();
    this.feedback.showToast(this.translate.instant('settings.toast.twoFactorEnabled'), 'success');
  }

  toggleConnection(index: number): void {
    const connection = this.connections[index];
    connection.status = !connection.status;
    this.updateField(connection.field, connection.status);
    const name = this.translate.instant(connection.nameKey);
    const status = this.translate.instant(
      connection.status ? 'settings.toast.connected' : 'settings.toast.disconnected',
    );
    this.feedback.showToast(
      this.translate.instant('settings.toast.connectionToggled', { name, status }),
      'info',
    );
  }

  toggleNotification(field: 'energyAlertsEnabled' | 'deviceFailureAlertsEnabled' | 'weeklyReportEmailsEnabled'): void {
    const enabled = !this.formData[field];
    this.updateField(field, enabled);
    this.feedback.showToast(
      this.translate.instant(
        enabled ? 'settings.toast.notificationEnabled' : 'settings.toast.notificationDisabled',
        { name: this.translate.instant(`settings.systemNotifications.${field}`) },
      ),
      'info',
    );
  }

  async saveChanges(): Promise<void> {
    const payload: Partial<SettingsState> = {
      ...this.formData,
      googleConnected: this.connections.find(item => item.field === 'googleConnected')?.status ?? this.formData.googleConnected,
      appleKitConnected: this.connections.find(item => item.field === 'appleKitConnected')?.status ?? this.formData.appleKitConnected,
      nestConnected: this.connections.find(item => item.field === 'nestConnected')?.status ?? this.formData.nestConnected,
      pgeUtilityConnected: this.connections.find(item => item.field === 'pgeUtilityConnected')?.status ?? this.formData.pgeUtilityConnected,
      grafanaIntegrationConnected:
        this.connections.find(item => item.field === 'grafanaIntegrationConnected')?.status ??
        this.formData.grafanaIntegrationConnected,
      sapErpConnected:
        this.connections.find(item => item.field === 'sapErpConnected')?.status ?? this.formData.sapErpConnected,
    };

    const ok = await this.settingsStore.saveSettings(payload);

    if (!ok) {
      this.feedback.showToast(this.translate.instant('settings.toast.saveFailed'), 'error');
      return;
    }

    this.saved = true;
    this.dirty = false;
    this.profileLocked = true;
    this.syncConnectionsFromForm();
    this.feedback.showToast(this.translate.instant('settings.toast.saved'), 'success');
    setTimeout(() => (this.saved = false), 2500);
  }

  uploadPhoto(): void {
    this.photoInput?.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.feedback.showToast(this.translate.instant('settings.toast.invalidImage'), 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.formData = { ...this.formData, profilePhoto: reader.result as string };
      this.dirty = true;
      this.feedback.showToast(this.translate.instant('settings.toast.photoUpdated'), 'success');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.formData = { ...this.formData, profilePhoto: this.defaultProfilePhoto };
    this.dirty = true;
    this.feedback.showToast(this.translate.instant('settings.toast.photoRemoved'), 'info');
  }

  toggleProfileEdit(): void {
    this.profileLocked = !this.profileLocked;
    this.feedback.showToast(
      this.translate.instant(this.profileLocked ? 'settings.toast.profileLocked' : 'settings.toast.profileUnlocked'),
      'info',
    );
  }

  openChangePassword(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showPasswordModal = true;
  }

  closeChangePassword(): void {
    this.showPasswordModal = false;
  }

  submitPasswordChange(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.feedback.showToast(this.translate.instant('settings.toast.passwordFieldsRequired'), 'warning');
      return;
    }
    if (this.newPassword.length < 8) {
      this.feedback.showToast(this.translate.instant('settings.toast.passwordMinLength'), 'warning');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.feedback.showToast(this.translate.instant('settings.toast.passwordMismatch'), 'error');
      return;
    }

    const userId = this.auth.currentUser?.id;
    if (!userId) {
      this.feedback.showToast(this.translate.instant('settings.toast.passwordUpdateFailed'), 'error');
      return;
    }

    this.authRepository.changePassword(userId, this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.formData = {
          ...this.formData,
          passwordUpdatedAt: new Date().toISOString(),
        };
        this.closeChangePassword();
        this.dirty = true;
        this.feedback.showToast(this.translate.instant('settings.toast.passwordUpdated'), 'success');
      },
      error: () => {
        this.feedback.showToast(this.translate.instant('settings.toast.passwordCurrentInvalid'), 'error');
      },
    });
  }

  manageAllHubs(): void {
    if (this.isBusinessMode()) {
      this.router.navigate(['/app/users/business-profile']);
      return;
    }
    this.router.navigate(['/app/smart-integrations/connected-services']);
  }

  manageRetention(): void {
    this.showRetentionModal = true;
  }

  closeRetentionModal(): void {
    this.showRetentionModal = false;
  }

  setRetention(days: number): void {
    this.updateField('dataRetentionDays', days);
    this.closeRetentionModal();
    this.feedback.showToast(
      this.translate.instant('settings.toast.retentionUpdated', {
        period: this.translate.instant(
          this.retentionOptions.find(option => option.days === days)?.labelKey ?? 'settings.retention.1year',
        ),
      }),
      'success',
    );
  }

  openGrantAccessModal(): void {
    this.grantAccessName = '';
    this.grantAccessEmail = '';
    this.grantAccessLevel = 'guest';
    this.showGrantAccessModal = true;
  }

  closeGrantAccessModal(): void {
    this.showGrantAccessModal = false;
  }

  submitGrantAccess(): void {
    if (!this.grantAccessName.trim()) {
      this.feedback.showToast(this.translate.instant('settings.toast.grantAccessNameRequired'), 'warning');
      return;
    }

    const newUser = this.securityStore.grantAccess(this.grantAccessName, {
      email: this.grantAccessEmail,
      accessLevel: this.grantAccessLevel,
    });

    if (!newUser) return;

    this.closeGrantAccessModal();
    this.feedback.showToast(
      this.translate.instant('settings.toast.accessGranted', { name: newUser.name }),
      'success',
    );
  }

  grantAccess(): void {
    this.openGrantAccessModal();
  }

  revokeGuestAccess(userId: string): void {
    this.securityStore.revokeGuestAccess(userId);
    this.feedback.showToast(this.translate.instant('settings.toast.accessRevoked'), 'success');
  }

  openUserActions(user: AuthorizedUser): void {
    this.selectedUser = user;
    this.showUserActionsModal = true;
  }

  closeUserActions(): void {
    this.showUserActionsModal = false;
    this.selectedUser = null;
  }

  changeUserAccessLevel(level: AccessLevel): void {
    if (!this.selectedUser) return;

    const updated = this.securityStore.updateUserAccessLevel(this.selectedUser.id, level);
    if (!updated) return;

    this.feedback.showToast(
      this.translate.instant('settings.toast.accessLevelChanged', {
        name: updated.name,
        level: this.translate.instant(`settings.accessLevels.${level}`),
      }),
      'success',
    );
    this.closeUserActions();
  }

  revokeSelectedUser(): void {
    if (!this.selectedUser || this.selectedUser.accessLevel !== 'guest') return;
    this.revokeGuestAccess(this.selectedUser.id);
    this.closeUserActions();
  }

  openTeamManagement(): void {
    this.router.navigate(['/app/users/team']);
  }

  openBusinessProfile(): void {
    this.router.navigate(['/app/users/business-profile']);
  }

  openAuditHistory(): void {
    this.router.navigate(['/app/reports/alerts-history']);
  }

  exportSettings(): void {
    const exportPayload = {
      profile: {
        fullName: this.formData.fullName,
        email: this.formData.email,
        homeZone: this.formData.homeZone,
        displayMode: this.formData.displayMode,
        timezone: this.formData.timezone,
        sessionTimeoutMinutes: this.formData.sessionTimeoutMinutes,
        dataRetentionDays: this.formData.dataRetentionDays,
      },
      security: {
        twoFactorEnabled: this.formData.twoFactorEnabled,
        passwordUpdatedAt: this.formData.passwordUpdatedAt,
      },
      notifications: {
        energyAlertsEnabled: this.formData.energyAlertsEnabled,
        deviceFailureAlertsEnabled: this.formData.deviceFailureAlertsEnabled,
        weeklyReportEmailsEnabled: this.formData.weeklyReportEmailsEnabled,
      },
      exportedAt: new Date().toISOString(),
    };

    downloadTextFile('domoticore-settings-export.json', JSON.stringify(exportPayload, null, 2));
    this.feedback.showToast(this.translate.instant('settings.toast.settingsExported'), 'success');
  }

  private syncConnectionsFromForm(): void {
    if (this.isBusinessMode()) {
      this.connections = [
        {
          nameKey: 'settings.businessConnections.pge',
          icon: GOOGLE_ICONS.electricMeter,
          status: !!this.formData.pgeUtilityConnected,
          field: 'pgeUtilityConnected',
        },
        {
          nameKey: 'settings.businessConnections.grafana',
          icon: GOOGLE_ICONS.barChart,
          status: !!this.formData.grafanaIntegrationConnected,
          field: 'grafanaIntegrationConnected',
        },
        {
          nameKey: 'settings.businessConnections.sap',
          icon: GOOGLE_ICONS.briefcase,
          status: !!this.formData.sapErpConnected,
          field: 'sapErpConnected',
        },
      ];
      return;
    }

    this.connections = [
      {
        nameKey: 'settings.connectionsList.googleHome',
        icon: GOOGLE_ICONS.home,
        status: !!this.formData.googleConnected,
        field: 'googleConnected',
      },
      {
        nameKey: 'settings.connectionsList.appleHomeKit',
        icon: GOOGLE_ICONS.apple,
        status: !!this.formData.appleKitConnected,
        field: 'appleKitConnected',
      },
      {
        nameKey: 'settings.connectionsList.nestServices',
        icon: GOOGLE_ICONS.nest,
        status: !!this.formData.nestConnected,
        field: 'nestConnected',
      },
    ];
  }
}
