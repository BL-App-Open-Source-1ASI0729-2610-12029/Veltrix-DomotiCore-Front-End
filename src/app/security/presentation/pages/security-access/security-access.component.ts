import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SecurityStore } from '../../../application/security.store';
import { AuthorizedUser } from '../../../domain/model/authorized-user.entity';
import { SecurityCamera } from '../../../domain/model/security-camera.entity';
import { SecurityLogEntry } from '../../../domain/model/security-log.entity';
import { LogIconType } from '../../../infrastructure/security-response';
import { AccessLevel } from '../../../infrastructure/security-response';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

const ASSET_ICONS = 'assets/icons/smart-home';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './security-access.component.html',
  styleUrl: './security-access.component.css',
})
export class SecurityAccessComponent implements OnInit {
  readonly store = inject(SecurityStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly icons = GOOGLE_ICONS;
  readonly accessLevels: AccessLevel[] = ['admin', 'member', 'guest'];

  readonly showGrantAccessModal = signal(false);
  readonly showUserActionsModal = signal(false);
  readonly showCameraModal = signal(false);
  readonly showFootageModal = signal(false);

  grantAccessName = '';
  grantAccessEmail = '';
  grantAccessLevel: AccessLevel = 'guest';
  selectedUser: AuthorizedUser | null = null;
  selectedCamera: SecurityCamera | null = null;
  selectedFootageEntry: SecurityLogEntry | null = null;

  ngOnInit(): void {
    this.store.loadAll();
    this.route.queryParams.subscribe(params => {
      const query = params['q'];
      if (typeof query === 'string' && query.trim()) {
        this.store.setSearchQuery(query.trim());
      }
    });
  }

  onSearch(event: Event): void {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  toggleLock(lockId: string): void {
    const updated = this.store.toggleLock(lockId);
    if (!updated) return;

    const name = this.translate.instant(updated.nameKey);
    this.feedback.showToast(
      this.translate.instant(
        updated.secured ? 'security.toast.lockSecured' : 'security.toast.lockUnlocked',
        { name },
      ),
      updated.secured ? 'success' : 'info',
    );
  }

  lockAllEntries(): void {
    this.store.lockAllEntries();
    this.feedback.showToast(this.translate.instant('security.toast.allLocked'), 'success');
  }

  viewAllCameras(): void {
    this.store.toggleShowAllCameras();
    this.feedback.showToast(
      this.translate.instant(
        this.store.showAllCameras()
          ? 'security.toast.showingAllCameras'
          : 'security.toast.showingPrimaryCameras',
      ),
      'info',
    );
  }

  openCamera(camera: SecurityCamera): void {
    this.store.selectCamera(camera.id);
    this.selectedCamera = camera;
    this.showCameraModal.set(true);
  }

  closeCameraModal(): void {
    this.showCameraModal.set(false);
    this.selectedCamera = null;
  }

  reviewFootage(entry?: SecurityLogEntry): void {
    const logEntry =
      entry ??
      this.store
        .filteredLogEntries()
        .find(item => item.actionKey && item.snapshotUrl) ??
      null;

    if (!logEntry) return;

    this.selectedFootageEntry = logEntry;
    this.showFootageModal.set(true);
  }

  closeFootageModal(): void {
    this.showFootageModal.set(false);
    this.selectedFootageEntry = null;
  }

  grantAccess(): void {
    this.grantAccessName = '';
    this.grantAccessEmail = '';
    this.grantAccessLevel = 'guest';
    this.showGrantAccessModal.set(true);
  }

  closeGrantAccessModal(): void {
    this.showGrantAccessModal.set(false);
  }

  submitGrantAccess(): void {
    if (!this.grantAccessName.trim()) {
      this.feedback.showToast(
        this.translate.instant('settings.toast.grantAccessNameRequired'),
        'warning',
      );
      return;
    }

    const newUser = this.store.grantAccess(this.grantAccessName, {
      email: this.grantAccessEmail,
      accessLevel: this.grantAccessLevel,
    });

    if (!newUser) return;

    this.closeGrantAccessModal();
    this.feedback.showToast(
      this.translate.instant('security.toast.accessGranted', { name: newUser.name }),
      'success',
    );
  }

  openUserActions(user: AuthorizedUser): void {
    this.selectedUser = user;
    this.showUserActionsModal.set(true);
  }

  closeUserActions(): void {
    this.showUserActionsModal.set(false);
    this.selectedUser = null;
  }

  changeUserAccessLevel(level: AccessLevel): void {
    if (!this.selectedUser) return;

    const updated = this.store.updateUserAccessLevel(this.selectedUser.id, level);
    if (!updated) return;

    this.feedback.showToast(
      this.translate.instant('settings.toast.accessLevelChanged', {
        name: updated.name,
        level: this.translate.instant(`security.accessLevels.${level}`),
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

  revokeGuestAccess(userId: string): void {
    this.store.revokeGuestAccess(userId);
    this.feedback.showToast(this.translate.instant('security.toast.accessRevoked'), 'success');
  }

  getLogIcon(iconType: LogIconType): string {
    const map: Record<LogIconType, string> = {
      enter: `${ASSET_ICONS}/log-enter.svg`,
      exit: `${ASSET_ICONS}/log-exit.svg`,
      alert: `${ASSET_ICONS}/log-alert.svg`,
      lock: `${ASSET_ICONS}/log-lock.svg`,
    };
    return map[iconType];
  }
}
