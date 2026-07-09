import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { LocalDataCacheService } from '../../shared/services/local-data-cache.service';
import { AuthUser } from '../domain/model/auth-user.entity';
import { AUTH_TOKEN_KEY, AuthApiEndpoint } from './auth-api-endpoint';

export interface AuthApiResponse {
  token: string;
  user: AuthUser;
}

const AUTH_REQUEST_TIMEOUT_MS = 180_000;

@Injectable({ providedIn: 'root' })
export class LocalAuthRepository {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LocalDataCacheService);

  loadUsers(): Observable<AuthUser[]> {
    const cached = this.cache.getCollection<AuthUser>(AuthApiEndpoint.users);
    if (cached?.length) {
      return of(cached);
    }

    return this.api.getCollection<AuthUser>(AuthApiEndpoint.users, AuthApiEndpoint.users).pipe(
      tap(users => this.cache.setCollection(AuthApiEndpoint.users, users)),
    );
  }

  saveUsers(users: AuthUser[]): void {
    this.cache.setCollection(AuthApiEndpoint.users, users);
  }

  appendUser(user: AuthUser, existing: AuthUser[]): AuthUser[] {
    const next = [
      ...existing.filter(item => item.email?.toLowerCase() !== user.email.toLowerCase()),
      user,
    ];
    this.saveUsers(next);
    return next;
  }

  findByCredentials(users: AuthUser[], email: string, password?: string): AuthUser | null {
    const normalizedEmail = email.toLowerCase();

    return (
      users.find(user => {
        const emailMatch = user.email?.toLowerCase() === normalizedEmail;
        if (!password) return emailMatch;
        return emailMatch && user.password === password;
      }) ?? null
    );
  }

  emailExists(users: AuthUser[], email: string): boolean {
    const normalizedEmail = email.toLowerCase();
    return users.some(user => user.email?.toLowerCase() === normalizedEmail);
  }

  hasApi(): boolean {
    return this.api.hasApi();
  }

  loginWithApi(email: string, password: string): Observable<AuthApiResponse> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/${AuthApiEndpoint.login}`;
    return this.http.post<AuthApiResponse>(url, { email, password }).pipe(
      timeout(AUTH_REQUEST_TIMEOUT_MS),
      tap(response => localStorage.setItem(AUTH_TOKEN_KEY, response.token)),
    );
  }

  registerWithApi(name: string, email: string, password: string): Observable<AuthApiResponse> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/${AuthApiEndpoint.register}`;
    return this.http.post<AuthApiResponse>(url, { name, email, password }).pipe(
      timeout(AUTH_REQUEST_TIMEOUT_MS),
      tap(response => localStorage.setItem(AUTH_TOKEN_KEY, response.token)),
    );
  }

  persistNewUser(user: AuthUser, existing: AuthUser[]): Observable<AuthUser> {
    if (this.api.hasApi()) {
      return this.api.postToCollection(AuthApiEndpoint.users, user, AuthApiEndpoint.users).pipe(
        map(() => {
          this.appendUser(user, existing);
          return user;
        }),
      );
    }

    this.appendUser(user, existing);
    return of(user);
  }

  updateUser(userId: string | number, updates: Partial<AuthUser>): Observable<AuthUser | null> {
    if (this.api.hasApi()) {
      return this.http
        .patch<AuthUser>(`${environment.apiUrl.replace(/\/$/, '')}/${AuthApiEndpoint.users}/${userId}`, updates)
        .pipe(
          tap(() => this.cache.clear(AuthApiEndpoint.users)),
          catchError(() => of(null)),
        );
    }

    return this.loadUsers().pipe(
      switchMap(users => {
        const index = users.findIndex(user => String(user.id) === String(userId));
        if (index === -1) {
          return of(null);
        }

        const updated = { ...users[index], ...updates };
        const next = [...users];
        next[index] = updated;
        this.saveUsers(next);
        return of(updated);
      }),
    );
  }

  refreshUser(userId: string | number): Observable<AuthUser | null> {
    if (!this.api.hasApi()) {
      return of(null);
    }

    const url = `${environment.apiUrl.replace(/\/$/, '')}/${AuthApiEndpoint.users}/${userId}`;
    return this.http.get<AuthUser>(url).pipe(catchError(() => of(null)));
  }

  changePassword(
    userId: string | number,
    currentPassword: string,
    newPassword: string,
  ): Observable<void> {
    if (!this.api.hasApi()) {
      return of(undefined);
    }

    const url = `${environment.apiUrl.replace(/\/$/, '')}/${AuthApiEndpoint.users}/${userId}/change-password`;
    return this.http.post<void>(url, { currentPassword, newPassword });
  }
}
