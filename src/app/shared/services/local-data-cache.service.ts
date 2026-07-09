import { Injectable } from '@angular/core';

const CACHE_VERSION = 'v3';
const VERSION_KEY = 'domoticore-cache:__version__';

@Injectable({ providedIn: 'root' })
export class LocalDataCacheService {
  private readonly prefix = 'domoticore-cache:';
  private userScope: string | null = null;

  constructor() {
    this.bustIfStale();
  }

  setUserScope(userId: string | number | null): void {
    this.userScope = userId != null ? String(userId) : null;
  }

  getCollection<T>(key: string): T[] | null {
    return this.read<T[]>(key);
  }

  setCollection<T>(key: string, data: T[]): void {
    this.write(key, data);
  }

  getObject<T>(key: string): T | null {
    return this.read<T>(key);
  }

  setObject<T>(key: string, data: T): void {
    this.write(key, data);
  }

  clear(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.prefix + this.scopedKey(key));
  }

  clearUserScope(): void {
    if (typeof localStorage === 'undefined' || !this.userScope) return;
    const scopePrefix = `${this.prefix}${this.userScope}:`;
    Object.keys(localStorage)
      .filter(k => k.startsWith(scopePrefix))
      .forEach(k => localStorage.removeItem(k));
  }

  clearAll(): void {
    if (typeof localStorage === 'undefined') return;
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }

  private bustIfStale(): void {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(VERSION_KEY) !== CACHE_VERSION) {
      this.clearAll();
      localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    }
  }

  private scopedKey(key: string): string {
    return this.userScope ? `${this.userScope}:${key}` : key;
  }

  private read<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.prefix + this.scopedKey(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write<T>(key: string, data: T): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.prefix + this.scopedKey(key), JSON.stringify(data));
  }
}
