import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiWarmupService } from '../../services/api-warmup.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  template: `
    <div class="auth-layout">
      <div
        class="auth-container"
        [class.auth-container--wide]="isWide()"
        [class.auth-container--register]="isRegister()">
        @if (apiWarmup.warming()) {
          <p class="warmup-banner">{{ 'messages.serverWaking' | translate }}</p>
        }
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      background: linear-gradient(180deg, var(--gray-100) 0%, var(--background) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .auth-container {
      width: 100%;
      max-width: 420px;
      padding: 2rem;
      background: var(--white);
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--gray-200);
    }

    .auth-container--register {
      max-width: 520px;
      padding: 2.5rem;
    }

    .auth-container--wide {
      max-width: 860px;
      padding: 2rem 2.25rem;
      background: var(--white);
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--gray-200);
    }

    .warmup-banner {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      color: #2c5282;
      font-size: 0.9rem;
      line-height: 1.45;
      text-align: center;
    }

    :root[data-theme='dark'] .auth-container {
      background: var(--surface);
      border-color: var(--gray-200);
    }

    @media (max-width: 768px) {
      .auth-layout {
        padding: 1rem;
      }

      .auth-container,
      .auth-container--register,
      .auth-container--wide {
        padding: 1.5rem;
      }
    }
  `],
})
export class AuthLayoutComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly apiWarmup = inject(ApiWarmupService);

  readonly isWide = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.includes('/onboarding')),
      startWith(this.router.url.includes('/onboarding')),
    ),
    { initialValue: false },
  );

  readonly isRegister = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.includes('/register')),
      startWith(this.router.url.includes('/register')),
    ),
    { initialValue: false },
  );

  constructor() {
    this.initializeTranslations();
  }

  ngOnInit(): void {
    this.apiWarmup.warmUp();
  }

  private initializeTranslations() {
    const browserLang = this.translate.getBrowserLang() || 'es';
    const supportedLanguages = ['en', 'es'];
    const currentLanguage = supportedLanguages.includes(browserLang) ? browserLang : 'es';

    this.translate.setDefaultLang('es');
    this.translate.use(currentLanguage);
  }
}
