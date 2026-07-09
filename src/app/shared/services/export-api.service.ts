import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from './api-client.service';

export type ExportDataset = 'energy-consumption' | 'alerts' | 'devices' | 'activity';
export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportFile {
  blob: Blob;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class ExportApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  hasApi(): boolean {
    return this.api.hasApi();
  }

  export(dataset: ExportDataset, format: ExportFormat, period?: string): Observable<ExportFile> {
    if (!this.hasApi()) {
      return throwError(() => new Error('export.api.unavailable'));
    }

    const body: Record<string, string> = { dataset, format };
    if (period?.trim()) {
      body['period'] = period.trim();
    }

    return this.http
      .post(`${this.baseUrl()}/exports`, body, { responseType: 'blob', observe: 'response' })
      .pipe(
        map(response => {
          const disposition = response.headers.get('Content-Disposition') ?? '';
          const match = disposition.match(/filename="?([^"]+)"?/);
          const fallbackExt = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'txt' : 'csv';
          const filename = match?.[1] ?? `domoticore-${dataset}.${fallbackExt}`;
          return { blob: response.body ?? new Blob(), filename };
        }),
      );
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }
}
