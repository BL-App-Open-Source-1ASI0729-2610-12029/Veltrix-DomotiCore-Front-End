import { Injectable, inject, signal } from '@angular/core';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { MaintenanceApiService } from '../infrastructure/maintenance-api.service';

@Injectable({ providedIn: 'root' })
export class MaintenanceStore {
  private readonly api = inject(MaintenanceApiService);

  readonly records = signal<MaintenanceRecord[]>([]);
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: records => {
        this.records.set(records);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  register(record: Omit<MaintenanceRecord, 'id'>): void {
    this.api.register(record).subscribe({
      next: entry => this.records.update(current => [entry, ...current]),
    });
  }
}
