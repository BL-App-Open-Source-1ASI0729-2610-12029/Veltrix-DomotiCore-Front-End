import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { AuthorizedUser, mapAuthorizedUser, toAuthorizedUserResponse } from '../domain/model/authorized-user.entity';
import { SecurityCamera, mapSecurityCamera } from '../domain/model/security-camera.entity';
import { SecurityLogEntry, mapSecurityLogEntry } from '../domain/model/security-log.entity';
import { SmartLock, mapSmartLock } from '../domain/model/smart-lock.entity';
import { SecurityApiEndpoint } from './security-api-endpoint';
import {
  AuthorizedUserResponse,
  SecurityCameraResponse,
  SecurityLogEntryResponse,
  SmartLockResponse,
} from './security-response';

@Injectable({ providedIn: 'root' })
export class SecurityApiService {
  private readonly api = inject(ApiClientService);

  getCameras(): Observable<SecurityCamera[]> {
    return this.api
      .getCollection<SecurityCameraResponse>(
        SecurityApiEndpoint.cameras,
        SecurityApiEndpoint.cameras,
      )
      .pipe(map(items => items.map(mapSecurityCamera)));
  }

  getLocks(): Observable<SmartLock[]> {
    return this.api
      .getCollection<SmartLockResponse>(SecurityApiEndpoint.locks, SecurityApiEndpoint.locks)
      .pipe(map(items => items.map(mapSmartLock)));
  }

  updateLock(lock: SmartLock): Observable<SmartLock> {
    return this.api
      .patchInCollection<SmartLockResponse>(
        SecurityApiEndpoint.locks,
        lock.id,
        lock,
        SecurityApiEndpoint.locks,
      )
      .pipe(map(mapSmartLock));
  }

  getAuthorizedUsers(): Observable<AuthorizedUser[]> {
    return this.api
      .getCollection<AuthorizedUserResponse>(
        SecurityApiEndpoint.users,
        SecurityApiEndpoint.users,
      )
      .pipe(map(items => items.map(mapAuthorizedUser)));
  }

  createAuthorizedUser(user: AuthorizedUser): Observable<AuthorizedUser> {
    return this.api
      .postToCollection<AuthorizedUserResponse>(
        SecurityApiEndpoint.users,
        toAuthorizedUserResponse(user),
        SecurityApiEndpoint.users,
      )
      .pipe(map(mapAuthorizedUser));
  }

  updateAuthorizedUser(user: AuthorizedUser): Observable<AuthorizedUser> {
    return this.api
      .patchInCollection<AuthorizedUserResponse>(
        SecurityApiEndpoint.users,
        user.id,
        toAuthorizedUserResponse(user),
        SecurityApiEndpoint.users,
      )
      .pipe(map(mapAuthorizedUser));
  }

  deleteAuthorizedUser(id: string): Observable<void> {
    return this.api.deleteFromCollection(
      SecurityApiEndpoint.users,
      id,
      SecurityApiEndpoint.users,
    );
  }

  getLogEntries(): Observable<SecurityLogEntry[]> {
    return this.api
      .getCollection<SecurityLogEntryResponse>(SecurityApiEndpoint.log, SecurityApiEndpoint.log)
      .pipe(map(items => items.map(mapSecurityLogEntry)));
  }
}
