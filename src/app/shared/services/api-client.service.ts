import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LocalDataCacheService } from './local-data-cache.service';

type EntityWithId = { id: string | number };

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(LocalDataCacheService);

  hasApi(): boolean {
    return !!environment.apiUrl?.trim();
  }

  getCollection<T>(apiPath: string, mockFile: string): Observable<T[]> {
    if (this.hasApi()) {
      return this.http.get<T[]>(this.apiUrl(apiPath)).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.loadCollection<T>(mockFile);
  }

  getById<T extends EntityWithId>(
    apiPath: string,
    id: string | number,
    mockFile: string,
  ): Observable<T> {
    if (this.hasApi()) {
      return this.http.get<T>(`${this.apiUrl(apiPath)}/${id}`).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.findInCollection<T>(mockFile, id);
  }

  getSingleton<T extends EntityWithId>(
    apiPath: string,
    id: string | number,
    mockFile: string,
  ): Observable<T> {
    return this.getById<T>(apiPath, id, mockFile);
  }

  getObject<T>(apiPath: string, mockFile: string): Observable<T> {
    if (this.hasApi()) {
      return this.http.get<T>(this.apiUrl(apiPath)).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.loadObject<T>(mockFile);
  }

  getObjectWithParams<T>(
    apiPath: string,
    params: Record<string, string | number | boolean>,
  ): Observable<T> {
    return this.http.get<T>(this.apiUrl(apiPath), { params });
  }

  postToCollection<T extends EntityWithId>(
    apiPath: string,
    body: T,
    mockFile: string,
  ): Observable<T> {
    if (this.hasApi()) {
      return this.http.post<T>(this.apiUrl(apiPath), body).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.appendToCollection(mockFile, body);
  }

  patchInCollection<T extends EntityWithId>(
    apiPath: string,
    id: string | number,
    body: Partial<T>,
    mockFile: string,
  ): Observable<T> {
    if (this.hasApi()) {
      return this.http.patch<T>(`${this.apiUrl(apiPath)}/${id}`, body).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.updateInCollection<T>(mockFile, id, body);
  }

  patchSingleton<T extends EntityWithId>(
    apiPath: string,
    id: string | number,
    body: Partial<T>,
    mockFile: string,
  ): Observable<T> {
    return this.patchInCollection<T>(apiPath, id, body, mockFile);
  }

  patchObject<T>(apiPath: string, body: Partial<T>, mockFile: string): Observable<T> {
    if (this.hasApi()) {
      return this.http.patch<T>(this.apiUrl(apiPath), body).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.mergeObject<T>(mockFile, body);
  }

  deleteFromCollection(
    apiPath: string,
    id: string | number,
    mockFile: string,
  ): Observable<void> {
    if (this.hasApi()) {
      return this.http.delete<void>(`${this.apiUrl(apiPath)}/${id}`).pipe(
        catchError(error => throwError(() => error)),
      );
    }
    return this.removeFromCollection(mockFile, id);
  }

  queryCollection<T>(
    apiPath: string,
    mockFile: string,
    predicate: (items: T[]) => T[],
  ): Observable<T[]> {
    if (this.hasApi()) {
      return this.http.get<T[]>(this.apiUrl(apiPath)).pipe(
        map(predicate),
        catchError(error => throwError(() => error)),
      );
    }
    return this.loadCollection<T>(mockFile).pipe(map(predicate));
  }

  private apiUrl(path: string): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const clean = path.replace(/^\//, '');
    return `${base}/${clean}`;
  }

  private mockUrl(file: string): string {
    return `/mock-data/${file}.json`;
  }

  private loadCollection<T>(mockFile: string): Observable<T[]> {
    const cached = this.cache.getCollection<T>(mockFile);
    if (cached != null && cached.length > 0) return of(cached);

    return this.http.get<T[]>(this.mockUrl(mockFile)).pipe(
      tap(data => this.cache.setCollection(mockFile, data)),
    );
  }

  private loadObject<T>(mockFile: string): Observable<T> {
    const cached = this.cache.getObject<T>(mockFile);
    if (cached) return of(cached);

    return this.http.get<T>(this.mockUrl(mockFile)).pipe(
      tap(data => this.cache.setObject(mockFile, data)),
    );
  }

  private findInCollection<T extends EntityWithId>(
    mockFile: string,
    id: string | number,
  ): Observable<T> {
    return this.loadCollection<T>(mockFile).pipe(
      switchMap(items => {
        const match = items.find(item => String(item.id) === String(id));
        return match ? of(match) : throwError(() => new Error(`Not found: ${id}`));
      }),
    );
  }

  private appendToCollection<T extends EntityWithId>(
    mockFile: string,
    body: T,
  ): Observable<T> {
    return this.loadCollection<T>(mockFile).pipe(
      map(items => {
        const next = [...items.filter(item => String(item.id) !== String(body.id)), body];
        this.cache.setCollection(mockFile, next);
        return body;
      }),
    );
  }

  private updateInCollection<T extends EntityWithId>(
    mockFile: string,
    id: string | number,
    body: Partial<T>,
  ): Observable<T> {
    return this.loadCollection<T>(mockFile).pipe(
      map(items => {
        let updated: T | undefined;
        const next = items.map(item => {
          if (String(item.id) !== String(id)) return item;
          updated = { ...item, ...body } as T;
          return updated;
        });
        this.cache.setCollection(mockFile, next);
        if (!updated) throw new Error(`Not found: ${id}`);
        return updated;
      }),
    );
  }

  private mergeObject<T>(mockFile: string, body: Partial<T>): Observable<T> {
    return this.loadObject<T>(mockFile).pipe(
      map(current => {
        const merged = { ...current, ...body };
        this.cache.setObject(mockFile, merged);
        return merged;
      }),
    );
  }

  private removeFromCollection(
    mockFile: string,
    id: string | number,
  ): Observable<void> {
    return this.loadCollection<EntityWithId>(mockFile).pipe(
      map(items => {
        const next = items.filter(item => String(item.id) !== String(id));
        this.cache.setCollection(mockFile, next);
      }),
    );
  }
}
