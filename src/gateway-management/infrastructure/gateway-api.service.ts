import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Gateway, GatewayNode } from '../domain/model/gateway.entity';

const GATEWAY_STORAGE_KEY = 'domoticore-gateway';
const NODES_STORAGE_KEY = 'domoticore-gateway-nodes';

const DEMO_GATEWAY_CODES = new Set([
  'AA:BB:CC:DD:EE:01',
  'VELTRIX-GW-001',
  'VELTRIX-GW-DEMO',
]);

function apiBase(): string {
  return environment.apiUrl.replace(/\/$/, '');
}

function mapHttpError(error: unknown, fallbackCode: string): Observable<never> {
  const body = (error as { error?: { message?: string } })?.error;
  const message = body?.message ?? fallbackCode;
  return throwError(() => new Error(message));
}

@Injectable({ providedIn: 'root' })
export class GatewayApiService {
  private readonly http = inject(HttpClient);

  getGateway(): Observable<Gateway | null> {
    if (!environment.apiUrl?.trim()) {
      return of(this.readGateway()).pipe(delay(200));
    }

    return this.http.get<Gateway | null>(`${apiBase()}/gateways/current`).pipe(
      tap(gateway => {
        if (gateway) {
          localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(gateway));
        } else {
          localStorage.removeItem(GATEWAY_STORAGE_KEY);
        }
      }),
      catchError(() => of(this.readGateway())),
    );
  }

  linkGateway(macOrId: string, label: string): Observable<Gateway> {
    if (!environment.apiUrl?.trim()) {
      return this.linkGatewayLocal(macOrId, label);
    }

    return this.http
      .post<Gateway>(`${apiBase()}/gateways/link`, { macOrId, label })
      .pipe(
        tap(gateway => localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(gateway))),
        catchError(error => mapHttpError(error, 'GATEWAY_NOT_DETECTED')),
      );
  }

  unlinkGateway(): Observable<void> {
    if (!environment.apiUrl?.trim()) {
      localStorage.removeItem(GATEWAY_STORAGE_KEY);
      localStorage.removeItem(NODES_STORAGE_KEY);
      return of(undefined).pipe(delay(200));
    }

    return this.http.delete<void>(`${apiBase()}/gateways/current`).pipe(
      tap(() => {
        localStorage.removeItem(GATEWAY_STORAGE_KEY);
        localStorage.removeItem(NODES_STORAGE_KEY);
      }),
      catchError(() => {
        localStorage.removeItem(GATEWAY_STORAGE_KEY);
        localStorage.removeItem(NODES_STORAGE_KEY);
        return of(undefined);
      }),
    );
  }

  registerNode(gatewayId: string, name: string, type: string): Observable<GatewayNode> {
    if (!environment.apiUrl?.trim()) {
      return this.registerNodeLocal(gatewayId, name, type);
    }

    return this.http
      .post<GatewayNode>(`${apiBase()}/gateways/current/nodes`, { name, type })
      .pipe(
        tap(node => {
          const nodes = this.readNodes();
          localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify([node, ...nodes]));
        }),
        catchError(error => mapHttpError(error, 'GATEWAY_OFFLINE')),
      );
  }

  listNodes(): Observable<GatewayNode[]> {
    if (!environment.apiUrl?.trim()) {
      return of(this.readNodes()).pipe(delay(150));
    }

    return this.http.get<GatewayNode[]>(`${apiBase()}/gateways/current/nodes`).pipe(
      tap(nodes => localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes))),
      catchError(() => of(this.readNodes())),
    );
  }

  private linkGatewayLocal(macOrId: string, label: string): Observable<Gateway> {
    const normalized = macOrId.trim().toUpperCase();
    const isValid = DEMO_GATEWAY_CODES.has(normalized) || /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalized);

    if (!isValid) {
      return throwError(() => new Error('GATEWAY_NOT_DETECTED'));
    }

    const now = new Date().toISOString();
    const gateway: Gateway = {
      id: 'gw-primary',
      label: label.trim() || 'Veltrix Gateway',
      macOrId: normalized,
      status: 'online',
      linkedAt: now,
      lastSeenAt: now,
    };

    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(gateway));
    return of(gateway).pipe(delay(600));
  }

  private registerNodeLocal(gatewayId: string, name: string, type: string): Observable<GatewayNode> {
    const gateway = this.readGateway();
    if (!gateway || gateway.status !== 'online') {
      return throwError(() => new Error('GATEWAY_OFFLINE'));
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return throwError(() => new Error('NODE_NAME_REQUIRED'));
    }

    const nodes = this.readNodes();
    if (nodes.some(node => node.name.toLowerCase() === trimmedName.toLowerCase())) {
      return throwError(() => new Error('NODE_ALREADY_EXISTS'));
    }

    const canRegister = /lamp|light|bulb|plug|sensor|switch|foco|luz|enchufe/i.test(`${trimmedName} ${type}`);
    const node: GatewayNode = {
      id: `node-${Date.now()}`,
      gatewayId,
      name: trimmedName,
      type: type.trim() || 'generic',
      status: canRegister ? 'registered' : 'failed',
      registeredAt: canRegister ? new Date().toISOString() : null,
    };

    nodes.unshift(node);
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    return of(node).pipe(delay(500));
  }

  private readGateway(): Gateway | null {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Gateway;
    } catch {
      return null;
    }
  }

  private readNodes(): GatewayNode[] {
    const raw = localStorage.getItem(NODES_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as GatewayNode[];
    } catch {
      return [];
    }
  }
}
