import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { DeviceDetail } from '../domain/model/device-detail.entity';
import { DeviceDetailAssembler } from './device-detail-assembler';
import { DeviceDetailResponse } from './device-detail-response';

const DETAILS_FILE = 'device-details';

@Injectable({ providedIn: 'root' })
export class DeviceDetailApiService {
  private readonly api = inject(ApiClientService);

  getById(deviceId: string): Observable<DeviceDetail> {
    return this.api
      .getById<DeviceDetailResponse>(DETAILS_FILE, deviceId, DETAILS_FILE)
      .pipe(map(dto => DeviceDetailAssembler.toDomain(dto)));
  }

  create(detail: DeviceDetail): Observable<DeviceDetail> {
    const response = DeviceDetailAssembler.toResponse(detail);
    return this.api
      .postToCollection(DETAILS_FILE, response, DETAILS_FILE)
      .pipe(map(dto => DeviceDetailAssembler.toDomain(dto)));
  }

  update(detail: DeviceDetail): Observable<DeviceDetail> {
    const response = DeviceDetailAssembler.toResponse(detail);
    return this.api
      .patchInCollection(DETAILS_FILE, detail.id, response, DETAILS_FILE)
      .pipe(map(dto => DeviceDetailAssembler.toDomain(dto)));
  }

  upsert(detail: DeviceDetail): Observable<DeviceDetail> {
    return this.update(detail).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return this.create(detail);
        }
        return throwError(() => error);
      }),
    );
  }

  delete(deviceId: string): Observable<void> {
    return this.api.deleteFromCollection(DETAILS_FILE, deviceId, DETAILS_FILE);
  }
}
