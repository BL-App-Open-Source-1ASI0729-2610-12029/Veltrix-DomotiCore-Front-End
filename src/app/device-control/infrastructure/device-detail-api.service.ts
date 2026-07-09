import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  delete(deviceId: string): Observable<void> {
    return this.api.deleteFromCollection(DETAILS_FILE, deviceId, DETAILS_FILE);
  }
}
