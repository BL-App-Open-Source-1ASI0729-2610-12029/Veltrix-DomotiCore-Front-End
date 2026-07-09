import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ACCOUNT_TYPE_OPTIONS,
  AccountType,
  AccountTypeOption,
  getAccountTypeRoute,
} from '../domain/model/account-type.entity';
import { AuthService } from './auth.service';

export type OnboardingStep = 1 | 2 | 3;

@Injectable({ providedIn: 'root' })
export class OnboardingStore {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentStep = signal<OnboardingStep>(1);
  readonly selectedType = signal<AccountType | null>(null);
  readonly submitting = signal(false);

  readonly totalSteps = 3;
  readonly accountTypeOptions: AccountTypeOption[] = ACCOUNT_TYPE_OPTIONS;

  readonly progressPercent = computed(() => (this.currentStep() / this.totalSteps) * 100);

  readonly canContinue = computed(() => {
    const step = this.currentStep();
    if (step === 1) return !!this.auth.currentUser;
    if (step === 2) return !!this.selectedType();
    if (step === 3) return !!this.selectedType();
    return false;
  });

  reset(): void {
    this.currentStep.set(1);
    this.selectedType.set(this.auth.currentUser?.accountType ?? null);
    this.submitting.set(false);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step < this.totalSteps && this.canContinue()) {
      this.currentStep.set((step + 1) as OnboardingStep);
    }
  }

  previousStep(): void {
    const step = this.currentStep();
    if (step > 1) {
      this.currentStep.set((step - 1) as OnboardingStep);
    }
  }

  selectAccountType(type: AccountType): void {
    this.selectedType.set(type);
  }

  complete(): void {
    const type = this.selectedType();
    if (!type || this.submitting()) return;

    this.submitting.set(true);
    this.auth.completeOnboarding(type).subscribe({
      next: success => {
        this.submitting.set(false);
        if (success) {
          this.router.navigateByUrl(getAccountTypeRoute(type));
        }
      },
      error: () => this.submitting.set(false),
    });
  }
}
