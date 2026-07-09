import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../iam/application/auth.service';

export interface DiscoveryStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  route: string;
}

const STORAGE_KEY = 'domoticore.feature-discovery.completed';

const SMART_HOME_STEPS: DiscoveryStep[] = [
  {
    id: 'dashboard',
    titleKey: 'featureDiscovery.steps.dashboard.title',
    descriptionKey: 'featureDiscovery.steps.dashboard.description',
    route: '/app/dashboard',
  },
  {
    id: 'devices',
    titleKey: 'featureDiscovery.steps.devices.title',
    descriptionKey: 'featureDiscovery.steps.devices.description',
    route: '/app/devices',
  },
  {
    id: 'energy',
    titleKey: 'featureDiscovery.steps.energy.title',
    descriptionKey: 'featureDiscovery.steps.energy.description',
    route: '/app/history/energy',
  },
  {
    id: 'gateway',
    titleKey: 'featureDiscovery.steps.gateway.title',
    descriptionKey: 'featureDiscovery.steps.gateway.description',
    route: '/app/devices/gateway',
  },
  {
    id: 'automation',
    titleKey: 'featureDiscovery.steps.automation.title',
    descriptionKey: 'featureDiscovery.steps.automation.description',
    route: '/app/automation',
  },
];

const BUSINESS_STEPS: DiscoveryStep[] = [
  {
    id: 'operations',
    titleKey: 'featureDiscovery.steps.operations.title',
    descriptionKey: 'featureDiscovery.steps.operations.description',
    route: '/app/operations-hub',
  },
  {
    id: 'reports',
    titleKey: 'featureDiscovery.steps.reports.title',
    descriptionKey: 'featureDiscovery.steps.reports.description',
    route: '/app/reports/comparative',
  },
  {
    id: 'businessDevices',
    titleKey: 'featureDiscovery.steps.businessDevices.title',
    descriptionKey: 'featureDiscovery.steps.businessDevices.description',
    route: '/app/devices/management',
  },
  {
    id: 'integrations',
    titleKey: 'featureDiscovery.steps.integrations.title',
    descriptionKey: 'featureDiscovery.steps.integrations.description',
    route: '/app/smart-integrations',
  },
  {
    id: 'alerts',
    titleKey: 'featureDiscovery.steps.alerts.title',
    descriptionKey: 'featureDiscovery.steps.alerts.description',
    route: '/app/settings',
  },
];

@Injectable({ providedIn: 'root' })
export class FeatureDiscoveryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);

  private readonly dismissedSignal = signal(this.isDismissed());
  private readonly stepIndexSignal = signal(0);
  private readonly minimizedSignal = signal(false);

  readonly dismissed = this.dismissedSignal.asReadonly();
  readonly stepIndex = this.stepIndexSignal.asReadonly();
  readonly minimized = this.minimizedSignal.asReadonly();

  readonly steps = computed(() =>
    this.auth.getEffectiveAccountType() === 'small-business' ? BUSINESS_STEPS : SMART_HOME_STEPS,
  );

  readonly currentStep = computed(() => this.steps()[this.stepIndexSignal()] ?? null);

  readonly progressLabel = computed(() => {
    const total = this.steps().length;
    const current = Math.min(this.stepIndexSignal() + 1, total);
    return `${current}/${total}`;
  });

  next(): void {
    const lastIndex = this.steps().length - 1;
    if (this.stepIndexSignal() >= lastIndex) {
      this.dismiss();
      return;
    }
    this.stepIndexSignal.update(index => index + 1);
  }

  previous(): void {
    this.stepIndexSignal.update(index => Math.max(0, index - 1));
  }

  goToStep(index: number): void {
    this.stepIndexSignal.set(Math.max(0, Math.min(index, this.steps().length - 1)));
    this.minimizedSignal.set(false);
  }

  minimize(): void {
    this.minimizedSignal.set(true);
  }

  expand(): void {
    this.minimizedSignal.set(false);
  }

  dismiss(): void {
    this.dismissedSignal.set(true);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, '1');
    }
  }

  reset(): void {
    this.dismissedSignal.set(false);
    this.stepIndexSignal.set(0);
    this.minimizedSignal.set(false);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private isDismissed(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return localStorage.getItem(STORAGE_KEY) === '1';
  }
}
