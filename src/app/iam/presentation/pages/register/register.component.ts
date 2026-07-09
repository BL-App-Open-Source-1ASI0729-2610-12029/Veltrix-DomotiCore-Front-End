import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../application/auth.service';
import { AuthFailureReason } from '../../../application/auth-result';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="auth-card">
      <h2>{{ 'pages.register' | translate }}</h2>
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.fullName' | translate }}</mat-label>
          <input matInput type="text" formControlName="name" autocomplete="name" />
          @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
            <mat-error>{{ 'errors.fullNameRequired' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.email' | translate }}</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
            @if (registerForm.get('email')?.errors?.['required']) {
              <mat-error>{{ 'errors.emailRequired' | translate }}</mat-error>
            }
            @if (registerForm.get('email')?.errors?.['email']) {
              <mat-error>{{ 'errors.invalidEmail' | translate }}</mat-error>
            }
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.password' | translate }}</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
            @if (registerForm.get('password')?.errors?.['required']) {
              <mat-error>{{ 'errors.passwordRequired' | translate }}</mat-error>
            }
            @if (registerForm.get('password')?.errors?.['minlength']) {
              <mat-error>{{ 'errors.passwordMinLength' | translate }}</mat-error>
            }
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.confirmPassword' | translate }}</mat-label>
          <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
          @if (registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) {
            <mat-error>{{ 'errors.confirmPasswordRequired' | translate }}</mat-error>
          }
          @if (registerForm.errors?.['mismatch'] && registerForm.get('confirmPassword')?.touched) {
            <mat-error>{{ 'errors.passwordMismatch' | translate }}</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="full-width submit-btn"
          [disabled]="registerForm.invalid || isSubmitting || registerSuccess">
          {{ (isSubmitting ? 'buttons.registering' : 'buttons.register') | translate }}
        </button>
      </form>

      @if (isSubmitting) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
        <p class="loading-message">{{ loadingMessageKey | translate }}</p>
      }

      @if (registerSuccess) {
        <p class="success-message">{{ 'messages.accountCreatedOnboarding' | translate }}</p>
      }
      @if (registerError) {
        <p class="error-message">{{ registerError }}</p>
      }

      <p class="auth-footer">
        {{ 'forms.alreadyHaveAccount' | translate }}
        <a routerLink="/auth/login">{{ 'buttons.login' | translate }}</a>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .auth-card { text-align: left; }

    h2 {
      color: var(--gray-900);
      margin: 0 0 1.75rem;
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .full-width { width: 100%; }

    .submit-btn {
      margin-top: 0.75rem;
      height: 48px;
      border-radius: 12px !important;
      font-weight: 600;
    }

    .error-message {
      margin-top: 1rem;
      color: #c53030;
      font-weight: 600;
      text-align: center;
    }

    .loading-bar {
      margin-top: 1rem;
      border-radius: 999px;
    }

    .loading-message {
      margin: 0.75rem 0 0;
      color: var(--gray-600);
      font-size: 0.95rem;
      text-align: center;
      line-height: 1.4;
    }

    .success-message {
      margin-top: 1rem;
      color: #38a169;
      font-weight: 600;
      text-align: center;
      background: #f0fff4;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #9ae6b4;
    }

    .auth-footer {
      margin: 1.5rem 0 0;
      text-align: center;
      color: var(--gray-600);
    }

    .auth-footer a {
      color: var(--primary-color);
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.25rem;
    }
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  registerForm: FormGroup;
  registerError = '';
  registerSuccess = false;
  isSubmitting = false;

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  readonly loadingMessageKey = 'messages.authInProgress';

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onSubmit() {
    this.registerError = '';
    this.registerSuccess = false;

    if (!this.registerForm.valid) {
      return;
    }

    const { name, email, password } = this.registerForm.value;
    this.isSubmitting = true;

    this.authService.register(name, email, password).subscribe({
      next: result => {
        this.isSubmitting = false;
        if (result.ok) {
          this.registerSuccess = true;
          this.router.navigate(['/auth/onboarding']);
          return;
        }
        this.registerError = this.translate.instant(this.errorKey(result.reason));
      },
      error: () => {
        this.isSubmitting = false;
        this.registerError = this.translate.instant('errors.registerFailed');
      },
    });
  }

  private errorKey(reason: AuthFailureReason): string {
    if (reason === 'timeout' || reason === 'network') return 'errors.serverWaking';
    if (reason === 'duplicate') return 'errors.emailAlreadyRegistered';
    return 'errors.registerFailed';
  }
}
