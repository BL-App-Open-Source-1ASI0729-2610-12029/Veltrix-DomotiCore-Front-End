export type GatewayConnectionStatus = 'online' | 'offline' | 'unlinked';

export interface Gateway {
  id: string;
  label: string;
  macOrId: string;
  status: GatewayConnectionStatus;
  linkedAt: string | null;
  lastSeenAt: string | null;
}

export interface GatewayNode {
  id: string;
  gatewayId: string;
  name: string;
  type: string;
  status: 'registered' | 'failed' | 'pending';
  registeredAt: string | null;
}
