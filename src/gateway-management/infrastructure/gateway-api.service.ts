import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Gateway, GatewayNode } from '../domain/model/gateway.entity';

const GATEWAY_STORAGE_KEY = 'domoticore-gateway';
const NODES_STORAGE_KEY = 'domoticore-gateway-nodes';

const DEMO_GATEWAY_CODES = new Set([
  'AA:BB:CC:DD:EE:01',
  'VELTRIX-GW-001',
  'VELTRIX-GW-DEMO',
]);

@Injectable({ providedIn: 'root' })
export class GatewayApiService {
  getGateway(): Observable<Gateway | null> {
    return of(this.readGateway()).pipe(delay(200));
  }

  linkGateway(macOrId: string, label: string): Observable<Gateway> {
    const normalized = macOrId.trim().toUpperCase();
    const isValid = DEMO_GATEWAY_CODES.has(normalized) || /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalized);

    if (!isValid) {
      throw new Error('GATEWAY_NOT_DETECTED');
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

  unlinkGateway(): Observable<void> {
    localStorage.removeItem(GATEWAY_STORAGE_KEY);
    localStorage.removeItem(NODES_STORAGE_KEY);
    return of(undefined).pipe(delay(200));
  }

  registerNode(gatewayId: string, name: string, type: string): Observable<GatewayNode> {
    const gateway = this.readGateway();
    if (!gateway || gateway.status !== 'online') {
      throw new Error('GATEWAY_OFFLINE');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('NODE_NAME_REQUIRED');
    }

    const nodes = this.readNodes();
    const duplicate = nodes.some(node => node.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      throw new Error('NODE_ALREADY_EXISTS');
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

  listNodes(): Observable<GatewayNode[]> {
    return of(this.readNodes()).pipe(delay(150));
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
