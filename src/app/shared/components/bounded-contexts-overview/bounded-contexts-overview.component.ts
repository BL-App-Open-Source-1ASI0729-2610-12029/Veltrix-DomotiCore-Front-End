import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../../material';

@Component({
  selector: 'app-bounded-contexts-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <section class="contexts-overview">
      <div class="contexts-header">
        <p class="section-label">{{ 'overview.sectionLabel' | translate }}</p>
        <h2>{{ 'overview.title' | translate }}</h2>
        <p class="section-description">
          {{ 'overview.description' | translate }}
        </p>
      </div>

      <div class="context-cards">
        <mat-card class="context-card content-card" *ngFor="let card of contextCards">
          <mat-card-content>
            <img [src]="card.icon" [alt]="card.iconAltKey | translate">
            <h3>{{ card.titleKey | translate }}</h3>
            <p>{{ card.descriptionKey | translate }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .contexts-overview {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .contexts-header {
      display: grid;
      gap: 0.5rem;
    }

    .section-label {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--secondary-color);
    }

    .section-description {
      max-width: 55rem;
      color: var(--gray-600);
      line-height: 1.7;
    }

    .context-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1rem;
    }

    .context-card {
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 24px;
      background: var(--surface);
      border: 1px solid rgba(90, 102, 129, 0.08);
      box-shadow: var(--shadow-sm);
    }

    .context-card img {
      width: 56px;
      height: 56px;
    }

    .context-card h3 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--gray-900);
    }

    .context-card p {
      margin: 0;
      color: var(--gray-600);
      line-height: 1.75;
    }
  `]
})
export class BoundedContextsOverviewComponent {
  readonly contextCards = [
    {
      icon: 'assets/icons/small-business/iam-icon.svg',
      iconAltKey: 'overview.iamIconAlt',
      titleKey: 'overview.iamTitle',
      descriptionKey: 'overview.iamDescription',
    },
    {
      icon: 'assets/icons/small-business/smart-integrations-icon.svg',
      iconAltKey: 'overview.integrationsIconAlt',
      titleKey: 'overview.integrationsTitle',
      descriptionKey: 'overview.integrationsDescription',
    },
    {
      icon: 'assets/icons/shared/automation-icon.svg',
      iconAltKey: 'overview.automationIconAlt',
      titleKey: 'overview.automationTitle',
      descriptionKey: 'overview.automationDescription',
    },
  ];
}
