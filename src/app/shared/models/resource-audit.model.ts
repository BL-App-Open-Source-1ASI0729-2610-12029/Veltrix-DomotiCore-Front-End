export interface ResourceAuditFields {
  createdByUserId?: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
  createdAt?: string;
  updatedByUserId?: number;
  updatedByName?: string;
  updatedByEmail?: string;
  updatedByRole?: string;
  updatedAt?: string;
}

export function hasResourceAudit(audit?: ResourceAuditFields): boolean {
  return !!(audit?.createdByName || audit?.createdAt);
}

export function formatCreatedByLabel(audit?: ResourceAuditFields): string | null {
  if (!audit?.createdByName || !audit.createdAt) {
    return null;
  }
  return `${audit.createdByName} (${audit.createdByRole ?? 'User'})`;
}
