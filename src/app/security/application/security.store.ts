import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizedUser } from '../domain/model/authorized-user.entity';
import { SecurityCamera } from '../domain/model/security-camera.entity';
import { SecurityLogEntry } from '../domain/model/security-log.entity';
import { SmartLock } from '../domain/model/smart-lock.entity';
import { SecurityApiService } from '../infrastructure/security-api.service';
import { AccessLevel } from '../infrastructure/security-response';

const ASSET_ICONS = 'assets/icons/smart-home';
const PRIMARY_CAMERA_COUNT = 2;

@Injectable({ providedIn: 'root' })
export class SecurityStore {
  private readonly api = inject(SecurityApiService);
  private readonly translate = inject(TranslateService);

  readonly cameras = signal<SecurityCamera[]>([]);
  readonly locks = signal<SmartLock[]>([]);
  readonly authorizedUsers = signal<AuthorizedUser[]>([]);
  readonly logEntries = signal<SecurityLogEntry[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly showAllCameras = signal(false);
  readonly selectedCameraId = signal<string | null>(null);

  readonly visibleCameras = computed(() => {
    const items = this.cameras();
    if (this.showAllCameras()) return items;
    return items.filter(camera => camera.isPrimary).slice(0, PRIMARY_CAMERA_COUNT);
  });

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.authorizedUsers();

    return this.authorizedUsers().filter(
      user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.accessLevel.includes(query),
    );
  });

  readonly filteredLogEntries = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.logEntries();

    return this.logEntries().filter(entry => {
      const title = this.translate.instant(entry.titleKey).toLowerCase();
      const location = this.translate.instant(entry.locationKey).toLowerCase();
      return (
        title.includes(query) ||
        location.includes(query) ||
        entry.time.toLowerCase().includes(query)
      );
    });
  });

  readonly allLocksSecured = computed(() => this.locks().every(lock => lock.secured));

  loadAuthorizedUsers(): void {
    this.api.getAuthorizedUsers().subscribe({
      next: users => this.authorizedUsers.set(users),
    });
  }

  loadAll(): void {
    this.loading.set(true);

    this.api.getCameras().subscribe({
      next: cameras => this.cameras.set(cameras),
    });

    this.api.getLocks().subscribe({
      next: locks => this.locks.set(locks),
    });

    this.api.getAuthorizedUsers().subscribe({
      next: users => this.authorizedUsers.set(users),
    });

    this.api.getLogEntries().subscribe({
      next: entries => {
        this.logEntries.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  toggleShowAllCameras(): void {
    this.showAllCameras.update(value => !value);
  }

  selectCamera(cameraId: string): void {
    this.selectedCameraId.set(cameraId);
  }

  toggleLock(lockId: string): SmartLock | null {
    const lock = this.locks().find(item => item.id === lockId);
    if (!lock) return null;

    const active = !lock.active;
    const updated: SmartLock = { ...lock, active, secured: active };

    this.locks.update(items => items.map(item => (item.id === lockId ? updated : item)));
    this.api.updateLock(updated).subscribe();

    return updated;
  }

  lockAllEntries(): void {
    const updated = this.locks().map(lock => ({ ...lock, active: true, secured: true }));
    this.locks.set(updated);
    updated.forEach(lock => this.api.updateLock(lock).subscribe());
  }

  grantAccess(name: string, options?: { email?: string; accessLevel?: AccessLevel }): AuthorizedUser | null {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const accessLevel = options?.accessLevel ?? 'guest';
    const email = options?.email?.trim() || `${trimmed.toLowerCase().replace(/\s+/g, '.')}@email.com`;

    const newUser: AuthorizedUser = {
      id: `user-${Date.now()}`,
      name: trimmed,
      email,
      avatarUrl: accessLevel === 'guest' ? `${ASSET_ICONS}/avatar-guest.jpg` : `${ASSET_ICONS}/avatar-marcus.jpg`,
      accessLevel,
      lastEntry: this.translate.instant('security.neverEntered'),
      expiresIn: accessLevel === 'guest' ? '24h' : undefined,
    };

    this.authorizedUsers.update(users => [...users, newUser]);
    this.api.createAuthorizedUser(newUser).subscribe({
      next: saved => {
        this.authorizedUsers.update(users =>
          users.map(user => (user.id === newUser.id ? saved : user)),
        );
      },
    });

    return newUser;
  }

  revokeGuestAccess(userId: string): void {
    this.authorizedUsers.update(users => users.filter(user => user.id !== userId));
    this.api.deleteAuthorizedUser(userId).subscribe();
  }

  updateUserAccessLevel(userId: string, accessLevel: AuthorizedUser['accessLevel']): AuthorizedUser | null {
    const user = this.authorizedUsers().find(item => item.id === userId);
    if (!user || user.accessLevel === accessLevel) return null;

    const updated: AuthorizedUser = { ...user, accessLevel };
    this.authorizedUsers.update(users =>
      users.map(item => (item.id === userId ? updated : item)),
    );
    this.api.updateAuthorizedUser(updated).subscribe({
      next: saved => {
        this.authorizedUsers.update(users =>
          users.map(item => (item.id === userId ? saved : item)),
        );
      },
    });

    return updated;
  }
}
