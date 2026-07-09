import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { Gateway, GatewayNode } from '../domain/model/gateway.entity';
import { GatewayApiService } from '../infrastructure/gateway-api.service';

@Injectable({ providedIn: 'root' })
export class GatewayStore {
  private readonly api = inject(GatewayApiService);

  readonly gateway = signal<Gateway | null>(null);
  readonly nodes = signal<GatewayNode[]>([]);
  readonly loading = signal(false);
  readonly linking = signal(false);
  readonly registeringNode = signal(false);

  load(): Observable<Gateway | null> {
    this.loading.set(true);
    return this.api.getGateway().pipe(
      tap(gateway => this.gateway.set(gateway)),
      finalize(() => this.loading.set(false)),
    );
  }

  loadNodes(): Observable<GatewayNode[]> {
    return this.api.listNodes().pipe(tap(nodes => this.nodes.set(nodes)));
  }

  link(macOrId: string, label: string): Observable<Gateway> {
    this.linking.set(true);
    return this.api.linkGateway(macOrId, label).pipe(
      tap(gateway => this.gateway.set(gateway)),
      finalize(() => this.linking.set(false)),
    );
  }

  unlink(): Observable<void> {
    this.loading.set(true);
    return this.api.unlinkGateway().pipe(
      tap(() => {
        this.gateway.set(null);
        this.nodes.set([]);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  registerNode(name: string, type: string): Observable<GatewayNode> {
    const gateway = this.gateway();
    if (!gateway) {
      throw new Error('GATEWAY_NOT_LINKED');
    }

    this.registeringNode.set(true);
    return this.api.registerNode(gateway.id, name, type).pipe(
      tap(node => this.nodes.update(current => [node, ...current])),
      finalize(() => this.registeringNode.set(false)),
    );
  }
}
