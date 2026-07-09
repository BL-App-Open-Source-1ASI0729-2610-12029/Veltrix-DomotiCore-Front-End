import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const WARMUP_REQUEST_TIMEOUT_MS = 120_000;
const WARMUP_BANNER_DELAY_MS = 3_000;

@Injectable({ providedIn: 'root' })
export class ApiWarmupService {
  private readonly http = inject(HttpClient);
  private inFlight = false;

  readonly warming = signal(false);
  readonly ready = signal(false);

  warmUp(): void {
    if (!environment.apiUrl?.trim() || this.ready() || this.inFlight) {
      return;
    }

    this.inFlight = true;
    const healthUrl = this.healthCheckUrl();
    let bannerTimer: ReturnType<typeof setTimeout> | undefined;

    this.http
      .get(healthUrl, { responseType: 'text' })
      .pipe(
        timeout(WARMUP_REQUEST_TIMEOUT_MS),
        catchError(() => of(null)),
        finalize(() => {
          if (bannerTimer) {
            clearTimeout(bannerTimer);
          }
          this.warming.set(false);
          this.ready.set(true);
          this.inFlight = false;
        }),
      )
      .subscribe({
        next: () => undefined,
        error: () => undefined,
        complete: () => undefined,
      });

    bannerTimer = setTimeout(() => {
      if (this.inFlight) {
        this.warming.set(true);
      }
    }, WARMUP_BANNER_DELAY_MS);
  }

  private healthCheckUrl(): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const root = base.endsWith('/api/v1') ? base.slice(0, -'/api/v1'.length) : base;
    return `${root}/actuator/health`;
  }
}
