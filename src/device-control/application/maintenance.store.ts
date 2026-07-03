import { Injectable, signal } from '@angular/core';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';

const STORAGE_KEY = 'domoticore-maintenance-records';

@Injectable({ providedIn: 'root' })
export class MaintenanceStore {
  readonly records = signal<MaintenanceRecord[]>([]);
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.records.set(this.readStorage());
    this.loading.set(false);
  }

  register(record: Omit<MaintenanceRecord, 'id'>): void {
    const entry: MaintenanceRecord = {
      ...record,
      id: `maint-${Date.now()}`,
    };
    const next = [entry, ...this.readStorage()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.records.set(next);
  }

  private readStorage(): MaintenanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY);
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
