import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureDiscoveryService } from '../../../services/feature-discovery.service';
import { MATERIAL_IMPORTS } from '../../../material';

@Component({
  selector: 'app-feature-discovery',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <button
      type="button"
      class="discovery-fab"
      *ngIf="!discovery.dismissed() && discovery.minimized()"
      (click)="discovery.expand()"
      [attr.aria-label]="'featureDiscovery.reopen' | translate"
    >
      <mat-icon>explore</mat-icon>
    </button>

    <aside class="discovery-panel" *ngIf="!discovery.dismissed() && !discovery.minimized() && discovery.currentStep() as step">
      <header class="discovery-panel__header">
        <div>
          <p class="discovery-panel__eyebrow">{{ 'featureDiscovery.eyebrow' | translate }}</p>
          <h3>{{ 'featureDiscovery.title' | translate }}</h3>
        </div>
        <div class="discovery-panel__header-actions">
          <span class="discovery-panel__progress">{{ discovery.progressLabel() }}</span>
          <button type="button" mat-icon-button (click)="discovery.minimize()" [attr.aria-label]="'featureDiscovery.minimize' | translate">
            <mat-icon>minimize</mat-icon>
          </button>
          <button type="button" mat-icon-button (click)="discovery.dismiss()" [attr.aria-label]="'common.close' | translate">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </header>

      <p class="discovery-panel__step-title">{{ step.titleKey | translate }}</p>
      <p class="discovery-panel__step-description">{{ step.descriptionKey | translate }}</p>

      <div class="discovery-panel__dots">
        <button
          type="button"
          class="discovery-dot"
          *ngFor="let item of discovery.steps(); let i = index"
          [class.discovery-dot--active]="discovery.stepIndex() === i"
          (click)="discovery.goToStep(i)"
          [attr.aria-label]="item.titleKey | translate"
        ></button>
      </div>

      <div class="discovery-panel__actions">
        <button type="button" mat-button (click)="discovery.previous()" [disabled]="discovery.stepIndex() === 0">
          {{ 'featureDiscovery.previous' | translate }}
        </button>
        <button type="button" mat-stroked-button color="primary" (click)="goToStep(step.route)">
          {{ 'featureDiscovery.tryIt' | translate }}
        </button>
        <button type="button" mat-flat-button color="primary" (click)="discovery.next()">
          {{ discovery.stepIndex() === discovery.steps().length - 1
            ? ('featureDiscovery.finish' | translate)
            : ('featureDiscovery.next' | translate) }}
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .discovery-fab {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 1050;
      width: 52px;
      height: 52px;
      border: none;
      border-radius: 50%;
      background: #2949c7;
      color: #fff;
      box-shadow: 0 10px 24px rgba(41, 73, 199, 0.35);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .discovery-panel {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 1050;
      width: min(100%, 360px);
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
      padding: 1rem 1rem 0.85rem;
      animation: discoveryIn 0.25s ease;
    }

    .discovery-panel__header {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .discovery-panel__eyebrow {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #2949c7;
    }

    .discovery-panel__header h3 {
      margin: 0.15rem 0 0;
      font-size: 1.05rem;
      color: #111827;
    }

    .discovery-panel__header-actions {
      display: flex;
      align-items: center;
      gap: 0.15rem;
    }

    .discovery-panel__progress {
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      margin-right: 0.15rem;
    }

    .discovery-panel__step-title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
    }

    .discovery-panel__step-description {
      margin: 0 0 0.85rem;
      color: #4b5563;
      line-height: 1.5;
      font-size: 0.92rem;
    }

    .discovery-panel__dots {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }

    .discovery-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: none;
      background: #d1d5db;
      cursor: pointer;
      padding: 0;
    }

    .discovery-dot--active {
      background: #2949c7;
      transform: scale(1.15);
    }

    .discovery-panel__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    @keyframes discoveryIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .discovery-panel,
      .discovery-fab {
        right: 0.75rem;
        bottom: 0.75rem;
      }
      .discovery-panel { width: calc(100% - 1.5rem); }
    }
  `],
})
export class FeatureDiscoveryComponent {
  readonly discovery = inject(FeatureDiscoveryService);
  private readonly router = inject(Router);

  goToStep(route: string): void {
    this.router.navigateByUrl(route);
    this.discovery.minimize();
  }
}
