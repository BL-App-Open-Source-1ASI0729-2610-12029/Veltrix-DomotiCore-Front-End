import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';

function apiBase(): string {
  return environment.apiUrl.replace(/\/$/, '');
}

@Injectable({ providedIn: 'root' })
export class MaintenanceApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<MaintenanceRecord[]> {
    if (!environment.apiUrl?.trim()) {
      return of(this.readLocal());
    }

    return this.http.get<MaintenanceRecord[]>(`${apiBase()}/maintenance-records`).pipe(
      catchError(() => of(this.readLocal())),
    );
  }

  register(record: Omit<MaintenanceRecord, 'id'>): Observable<MaintenanceRecord> {
    if (!environment.apiUrl?.trim()) {
      const entry: MaintenanceRecord = {
        ...record,
        id: `maint-${Date.now()}`,
      };
      const next = [entry, ...this.readLocal()];
      localStorage.setItem('domoticore-maintenance-records', JSON.stringify(next));
      return of(entry);
    }

    return this.http.post<MaintenanceRecord>(`${apiBase()}/maintenance-records`, record).pipe(
      catchError(() => {
        const entry: MaintenanceRecord = {
          ...record,
          id: `maint-${Date.now()}`,
        };
        const next = [entry, ...this.readLocal()];
        localStorage.setItem('domoticore-maintenance-records', JSON.stringify(next));
        return of(entry);
      }),
    );
  }

  private readLocal(): MaintenanceRecord[] {
    const raw = localStorage.getItem('domoticore-maintenance-records');
    if (!raw) {
      return [
        {
          id: 'maint-seed-1',
          deviceId: 'smart-ac',
          deviceName: 'Living Room AC',
          performedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
          description: 'Filter cleaning and coolant check',
          technician: 'Internal team',
        },
      ];
    }
    try {
      return JSON.parse(raw) as MaintenanceRecord[];
    } catch {
      return [];
    }
  }
}
