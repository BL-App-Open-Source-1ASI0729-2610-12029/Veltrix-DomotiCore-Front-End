import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { IntegrationsApiService, ConnectedIntegration } from '../../../infrastructure/integrations-api.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-connected-services',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="devices">
      <div class="devices-header">
        <h1>{{ 'navigation.connectedServices' | translate }}</h1>
        <a mat-stroked-button routerLink="/app/smart-integrations/compatibility">
          {{ 'compatibility.title' | translate }}
        </a>
      </div>
      <div class="devices-grid">
        <div class="device-card" *ngFor="let service of services()">
          <div class="device-header">
            <h3>{{ service.nameKey ? (service.nameKey | translate) : service.name }}</h3>
            <span class="device-status" [class.online]="service.online" [class.offline]="!service.online">
              {{ service.online ? ('connectedServices.online' | translate) : ('connectedServices.offline' | translate) }}
            </span>
          </div>
          <p class="device-type">{{ service.typeKey ? (service.typeKey | translate) : service.type }}</p>
          <div class="device-controls">
            <button mat-stroked-button class="btn-toggle" [class.active]="service.active" (click)="toggleService(service)">
              {{ service.active ? ('buttons.disable' | translate) : ('buttons.enable' | translate) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .devices {
      padding: 2rem;
      animation: fadeIn 0.6s ease-in;
    }
    .devices-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.75rem;
    }
    .devices h1 {
      color: var(--gray-900);
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
    }
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
    }
    .device-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: 20px;
      padding: 1.75rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .device-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }
    .device-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .device-header h3 {
      color: var(--gray-900);
      margin: 0;
      font-size: 1.15rem;
    }
    .device-status {
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .device-status.online {
      background: rgba(34, 197, 94, 0.15);
      color: #15803d;
    }
    .device-status.offline {
      background: rgba(239, 68, 68, 0.15);
      color: #b91c1c;
    }
    .device-type {
      color: var(--gray-600);
      margin-bottom: 1.5rem;
    }
    .device-controls {
      text-align: center;
    }
    .btn-toggle {
      background: var(--primary-color);
      color: var(--white);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.2s ease;
      font-weight: 600;
    }
    .btn-toggle:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }
    .btn-toggle.active {
      background: var(--secondary-color);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .devices {
        padding: 0;
      }

      .devices h1 {
        font-size: clamp(1.45rem, 5vw, 2.5rem);
        text-align: left;
      }

      .devices-grid {
        grid-template-columns: 1fr;
      }

      .device-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .btn-toggle {
        width: 100%;
      }
    }
  `]
})
export class ConnectedServicesComponent implements OnInit {
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly integrationsApi = inject(IntegrationsApiService);

  services = signal<Array<{
    id: string;
    nameKey?: string;
    name?: string;
    typeKey?: string;
    type?: string;
    online: boolean;
    active: boolean;
  }>>([]);

  ngOnInit(): void {
    this.integrationsApi.getIntegrations().subscribe(data => {
      const mapped = (data.connectedIntegrations ?? []).map(item => this.mapIntegration(item));
      if (mapped.length) {
        this.services.set(mapped);
        return;
      }
      this.services.set(this.defaultServices());
    });
  }

  private defaultServices() {
    return [
      { id: 'lighting-hub', nameKey: 'integrations.samples.lightingHub', type: 'Veltrix Lighting', online: true, active: true },
      { id: 'hvac-bridge', nameKey: 'integrations.samples.hvacBridge', type: 'ClimateSync', online: false, active: false },
    ];
  }

  private mapIntegration(item: ConnectedIntegration) {
    return {
      id: item.id,
      nameKey: item.nameKey,
      name: item.name ?? item.provider,
      type: item.provider,
      online: item.status === 'online',
      active: item.connected,
    };
  }

  private getServiceName(service: { nameKey?: string; name?: string }): string {
    return service.nameKey ? this.translate.instant(service.nameKey) : (service.name ?? '');
  }

  toggleService(service: { id: string; nameKey?: string; name?: string; active: boolean; online: boolean }) {
    const displayName = this.getServiceName(service);

    if (!service.online && !service.active) {
      this.feedback.showToast(
        this.translate.instant('connectedServices.toast.offlineCannotEnable', { name: displayName }),
        'warning'
      );
      return;
    }

    const nextActive = !service.active;
    const updated = this.services().map(item =>
      item.id === service.id
        ? { ...item, active: nextActive }
        : item,
    );
    this.services.set(updated);

    this.integrationsApi
      .patchIntegrations({
        connectedIntegrations: updated.map(item => ({
          id: item.id,
          nameKey: item.nameKey,
          name: item.name,
          provider: item.type ?? item.name,
          connected: item.active,
          status: item.online ? 'online' : 'offline',
        })),
      })
      .subscribe();

    this.feedback.showToast(
      this.translate.instant('connectedServices.toast.toggled', {
        name: displayName,
        status: this.translate.instant(
          nextActive ? 'connectedServices.status.enabled' : 'connectedServices.status.disabled'
        ),
      }),
      nextActive ? 'success' : 'info'
    );
  }
}