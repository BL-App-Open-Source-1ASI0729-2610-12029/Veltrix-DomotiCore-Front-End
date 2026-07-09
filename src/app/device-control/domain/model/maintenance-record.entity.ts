import { ResourceAuditFields } from '../../../shared/models/resource-audit.model';

export interface MaintenanceRecord extends ResourceAuditFields {
  id: string;
  deviceId: string;
  deviceName: string;
  performedAt: string;
  description: string;
  technician?: string;
}
