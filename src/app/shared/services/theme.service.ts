import { Injectable } from '@angular/core';

export type DisplayMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'domoticore-theme';

  apply(mode: DisplayMode): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, mode);
    }
  }

  init(): void {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(this.storageKey) as DisplayMode | null;
    if (stored === 'light' || stored === 'dark') {
      this.apply(stored);
    }
  }

  getCurrent(): DisplayMode | null {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(this.storageKey);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }
}
