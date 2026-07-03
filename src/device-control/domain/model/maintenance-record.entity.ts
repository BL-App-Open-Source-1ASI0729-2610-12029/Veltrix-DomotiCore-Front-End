export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  performedAt: string;
  description: string;
  technician?: string;
}
