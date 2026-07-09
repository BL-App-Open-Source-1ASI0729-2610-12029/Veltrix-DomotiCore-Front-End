import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthFailureReason, AuthLoginResult, AuthRegisterResult } from './auth-result';
import { SettingsStore } from '../../settings/application/settings.store';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
import { TeamInvitationService } from '../../team-management/application/team-invitation.service';
import { TeamMembershipService } from '../../team-management/application/team-membership.service';
import { AccountType, getAccountTypeRoute, isOnboardingComplete } from '../domain/model/account-type.entity';
import { AuthUser, createLocalUser, stripPassword } from '../domain/model/auth-user.entity';
import { normalizePlatformRole } from '../domain/model/platform-role.entity';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, ACTIVE_SEGMENT_KEY } from '../infrastructure/auth-api-endpoint';
import { LocalAuthRepository } from '../infrastructure/local-auth.repository';

export type { AuthUser };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly localAuth = inject(LocalAuthRepository);
  private readonly router = inject(Router);
  private readonly cache = inject(LocalDataCacheService);
  private readonly settingsStore = inject(SettingsStore);

  currentUser: AuthUser | null = null;

  private get teamInvitations(): TeamInvitationService {
    return this.injector.get(TeamInvitationService);
  }

  private get teamMembership(): TeamMembershipService {
    return this.injector.get(TeamMembershipService);
  }

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      this.currentUser = null;
      return;
    }

    try {
      this.currentUser = JSON.parse(raw) as AuthUser;
      this.cache.setUserScope(this.currentUser.id);
      if (this.currentUser?.email) {
        this.teamInvitations.startPolling(this.currentUser);
        this.teamMembership.sync();
      }
    } catch {
      this.currentUser = null;
      this.cache.setUserScope(null);
    }
  }

  private persistSession(user: AuthUser): void {
    this.currentUser = user;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    this.cache.setUserScope(user.id);
  }

  private clearUserScopedCache(): void {
    this.cache.clearUserScope();
    this.cache.clear('user-profile');
    this.cache.clear('users');
    this.cache.clear('business-profile');
    this.cache.clear('zone-configuration');
    this.cache.clear('team-management');
    this.cache.clear('cost-analysis');
    this.cache.clear('devices-overview');
    this.cache.clear('maintenance-records');
    this.cache.clear('gateways');
  }

  private clearSegmentScopedCache(): void {
    this.cache.clear('devices-overview');
    this.cache.clear('business-profile');
    this.cache.clear('zone-configuration');
    this.cache.clear('team-management');
    this.cache.clear('cost-analysis');
    this.cache.clear('maintenance-records');
    this.cache.clear('gateways');
  }

  private afterAuthenticated(user: AuthUser): Observable<AuthUser> {
    this.clearUserScopedCache();
    this.persistSession(user);
    this.settingsStore.reset();
    this.settingsStore.fetchSettings();
    this.teamInvitations.startPolling(user);
    this.teamMembership.sync();
    this.refreshUserInBackground(user);
    return of(user);
  }

  private refreshUserInBackground(user: AuthUser): void {
    this.localAuth
      .refreshUser(user.id)
      .pipe(
        tap(refreshed => {
          if (refreshed) {
            this.persistSession(refreshed);
          }
        }),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  private mapAuthError(error: unknown, duplicateStatus = 409): AuthFailureReason {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'network';
      }
      if (error.status === 401 || error.status === 403) {
        return 'credentials';
      }
      if (error.status === duplicateStatus) {
        return 'duplicate';
      }
      return 'server';
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'timeout';
    }
    return 'server';
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasCompletedOnboarding(): boolean {
    return isOnboardingComplete(
      this.currentUser?.accountType,
      this.currentUser?.onboardingCompleted,
      this.currentUser?.role,
    );
  }

  getPlatformRole(): string {
    return normalizePlatformRole(this.currentUser?.role);
  }

  canAccessBothSegments(): boolean {
    return normalizePlatformRole(this.currentUser?.role) === 'Admin';
  }

  getAccountType(): AccountType | null {
    return this.currentUser?.accountType ?? null;
  }

  getActiveSegment(): AccountType {
    if (!this.canAccessBothSegments()) {
      return this.currentUser?.accountType ?? 'smart-home';
    }

    const stored = localStorage.getItem(ACTIVE_SEGMENT_KEY) as AccountType | null;
    if (stored === 'smart-home' || stored === 'small-business') {
      return stored;
    }

    return 'smart-home';
  }

  getEffectiveAccountType(): AccountType {
    return this.getActiveSegment();
  }

  switchSegment(segment: AccountType): void {
    if (!this.canAccessBothSegments()) {
      return;
    }

    if (this.getActiveSegment() === segment) {
      return;
    }

    localStorage.setItem(ACTIVE_SEGMENT_KEY, segment);
    this.clearSegmentScopedCache();
    this.settingsStore.reset();
    this.settingsStore.fetchSettings();
    this.router.navigateByUrl(getAccountTypeRoute(segment));
  }

  getDefaultRoute(): string {
    if (!this.isAuthenticated()) return '/auth/login';
    if (!this.hasCompletedOnboarding()) return '/auth/onboarding';
    return getAccountTypeRoute(this.getEffectiveAccountType());
  }

  login(email: string, password: string): Observable<AuthLoginResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.localAuth.hasApi()) {
      return this.localAuth.loginWithApi(normalizedEmail, password).pipe(
        switchMap(response =>
          this.afterAuthenticated(response.user).pipe(map(() => ({ ok: true as const }))),
        ),
        catchError(error => of({ ok: false as const, reason: this.mapAuthError(error) })),
      );
    }

    return this.localAuth.loadUsers().pipe(
      map(users => this.localAuth.findByCredentials(users, normalizedEmail, password)),
      switchMap(user => {
        if (!user) return of({ ok: false as const, reason: 'credentials' as const });
        return this.afterAuthenticated(stripPassword(user)).pipe(map(() => ({ ok: true as const })));
      }),
      catchError(() => of({ ok: false as const, reason: 'server' as const })),
    );
  }

  register(name: string, email: string, password: string): Observable<AuthRegisterResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.localAuth.hasApi()) {
      return this.localAuth.registerWithApi(name.trim(), normalizedEmail, password).pipe(
        switchMap(response =>
          this.afterAuthenticated(response.user).pipe(
            map(() => ({ ok: true as const, user: response.user })),
          ),
        ),
        catchError(error => of({ ok: false as const, reason: this.mapAuthError(error) })),
      );
    }

    return this.localAuth.loadUsers().pipe(
      switchMap(users => {
        if (this.localAuth.emailExists(users, normalizedEmail)) {
          return of<AuthRegisterResult>({ ok: false, reason: 'duplicate' });
        }

        const newUser = createLocalUser(name.trim(), normalizedEmail, password);
        return this.localAuth.persistNewUser(newUser, users).pipe(
          map(() => newUser),
          catchError(() => {
            this.localAuth.appendUser(newUser, users);
            return of(newUser);
          }),
        );
      }),
      switchMap(result => {
        if ('ok' in result) {
          return of(result);
        }

        return this.afterAuthenticated(stripPassword(result)).pipe(
          map(safeUser => ({ ok: true as const, user: safeUser })),
        );
      }),
      catchError(() => of({ ok: false as const, reason: 'server' as const })),
    );
  }

  completeOnboarding(accountType: AccountType): Observable<boolean> {
    if (!this.currentUser) {
      return of(false);
    }

    const userId = this.currentUser.id;
    const updatedUser: AuthUser = {
      ...this.currentUser,
      accountType,
      onboardingCompleted: true,
    };
    this.persistSession(updatedUser);

    return this.localAuth
      .updateUser(userId, { accountType, onboardingCompleted: true })
      .pipe(
        tap(user => {
          if (user) {
            this.persistSession(user);
          }
        }),
        map(() => true),
        catchError(() => of(true)),
      );
  }

  acceptInviteToken(token: string): void {
    this.teamInvitations.acceptInviteToken(token, this.currentUser);
  }

  logout(): void {
    this.teamInvitations.stopPolling();
    this.currentUser = null;
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_SEGMENT_KEY);
    this.cache.setUserScope(null);
    this.clearUserScopedCache();
    this.settingsStore.reset();
    this.router.navigate(['/auth/login']);
  }
}
