export type DocumentStatus = 'verified' | 'pending';
export type SyncInterval = 15 | 30 | 60 | 120;

export interface TaxDocument {
  id: string;
  nameKey?: string;
  name?: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface WebhookItem {
  id: string;
  labelKey: string;
  url: string;
  connected: boolean;
  enabled: boolean;
}

export interface ProviderState {
  nameKey: string;
  accountId: string;
  rateSchedule: string;
  connected: boolean;
  backupProvider: string | null;
}

export interface BusinessProfile {
  businessName: string;
  tin: string;
  address: string;
  apiKey: string;
  syncInterval: SyncInterval;
  apiUsagePercent: number;
  provider: ProviderState;
  documents: TaxDocument[];
  webhooks: WebhookItem[];
  upgradeRequested: boolean;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'Sterling Energy Solutions LLC',
  tin: 'XX-XXXX5678',
  address: '452 Innovation Way, Ste 300, Palo Alto, CA 94304',
  apiKey: 'dc_live_7294_bb12_9xae_0012_pq89',
  syncInterval: 15,
  apiUsagePercent: 75,
  provider: {
    nameKey: 'businessProfile.samples.providerName',
    accountId: '982300-442-1',
    rateSchedule: 'Commercial Rate Schedule B-19',
    connected: true,
    backupProvider: null,
  },
  documents: [
    {
      id: 'doc-1',
      nameKey: 'businessProfile.documents.form3468',
      status: 'verified',
      uploadedAt: '2024-03-12T00:00:00.000Z',
    },
    {
      id: 'doc-2',
      nameKey: 'businessProfile.documents.solarAudit',
      status: 'pending',
      uploadedAt: '2024-04-05T00:00:00.000Z',
    },
  ],
  webhooks: [
    {
      id: 'grafana',
      labelKey: 'hooks.grafana',
      url: 'https://grafana.sterling-energy.io/hooks/domoticore',
      connected: true,
      enabled: true,
    },
    {
      id: 'sap',
      labelKey: 'hooks.sap',
      url: 'https://sap.sterling-energy.io/api/energy-events',
      connected: true,
      enabled: true,
    },
  ],
  upgradeRequested: false,
};
