import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import { DevicesOverview } from '../domain/model/devices-overview.entity';
import { DevicesOverviewAssembler } from './devices-overview-assembler';
import { DevicesOverviewResponse } from './devices-overview-response';

const OVERVIEW_FILE = 'devices-overview';
const OVERVIEW_ID = 1;

@Injectable({ providedIn: 'root' })
export class DevicesOverviewApiService {
  private readonly api = inject(ApiClientService);

  getOverview(): Observable<DevicesOverview> {
    return this.api
      .getSingleton<DevicesOverviewResponse>(OVERVIEW_FILE, OVERVIEW_ID, OVERVIEW_FILE)
      .pipe(map(dto => DevicesOverviewAssembler.toDomain(dto)));
  }

  saveOverview(overview: DevicesOverview): Observable<DevicesOverview> {
    const payload: DevicesOverviewResponse & { id: number } = {
      id: OVERVIEW_ID,
      ...overview,
    };

    return this.api
      .patchSingleton(OVERVIEW_FILE, OVERVIEW_ID, payload, OVERVIEW_FILE)
      .pipe(map(dto => DevicesOverviewAssembler.toDomain(dto)));
  }
}
