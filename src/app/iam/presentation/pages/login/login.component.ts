import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../application/auth.service';
import { AuthFailureReason } from '../../../application/auth-result';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="auth-card">
      <h2>{{ 'pages.login' | translate }}</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.email' | translate }}</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
            @if (loginForm.get('email')?.errors?.['required']) {
              <mat-error>{{ 'errors.emailRequired' | translate }}</mat-error>
            }
            @if (loginForm.get('email')?.errors?.['email']) {
              <mat-error>{{ 'errors.invalidEmail' | translate }}</mat-error>
            }
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'forms.password' | translate }}</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="current-password" />
          @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
            <mat-error>{{ 'errors.passwordRequired' | translate }}</mat-error>
          }
        </mat-form-field>

        @if (loginError) {
          <p class="error-message">{{ loginError }}</p>
        }

        @if (isSubmitting) {
          <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
          <p class="loading-message">{{ loadingMessageKey | translate }}</p>
        }

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="full-width submit-btn"
          [disabled]="loginForm.invalid || isSubmitting">
          {{ (isSubmitting ? 'buttons.loggingIn' : 'buttons.login') | translate }}
        </button>
      </form>

      <p class="auth-footer">
        {{ 'forms.dontHaveAccount' | translate }}
        <a routerLink="/auth/register">{{ 'buttons.register' | translate }}</a>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .auth-card {
      text-align: left;
      animation: fadeIn 0.5s ease-in;
    }

    h2 {
      color: var(--gray-900);
      margin: 0 0 1.5rem;
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
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
      font-size: 1rem;
      font-weight: 600;
    }

    .error-message {
      color: #c53030;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    .loading-bar {
      margin-top: 0.75rem;
      border-radius: 999px;
    }

    .loading-message {
      margin: 0.75rem 0 0;
      color: var(--gray-600);
      font-size: 0.95rem;
      text-align: center;
      line-height: 1.4;
    }

    .auth-footer {
      margin: 2rem 0 0;
      text-align: center;
      color: var(--gray-600);
    }

    .auth-footer a {
      color: var(--primary-color);
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.25rem;
    }

    .auth-footer a:hover {
      color: var(--primary-strong);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  loginForm: FormGroup;
  loginError = '';
  isSubmitting = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  readonly loadingMessageKey = 'messages.authInProgress';

  onSubmit() {
    this.loginError = '';

    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isSubmitting = true;

    this.authService.login(email, password).subscribe({
      next: result => {
        this.isSubmitting = false;
        if (result.ok) {
          this.router.navigateByUrl(this.authService.getDefaultRoute());
          return;
        }
        this.loginError = this.translate.instant(this.errorKey(result.reason));
      },
      error: () => {
        this.isSubmitting = false;
        this.loginError = this.translate.instant('errors.loginFailed');
      },
    });
  }

  private errorKey(reason: AuthFailureReason): string {
    if (reason === 'timeout' || reason === 'network') return 'errors.serverWaking';
    if (reason === 'credentials') return 'errors.invalidCredentials';
    return 'errors.loginFailed';
  }
}
