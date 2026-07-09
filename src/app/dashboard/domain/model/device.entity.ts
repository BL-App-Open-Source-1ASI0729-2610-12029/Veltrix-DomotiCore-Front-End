export type DeviceUsageCategory = 'lighting' | 'climate' | 'security' | 'entertainment' | 'generic';

export interface DeviceEntity {
  id?: string;
  name?: string;
  nameKey?: string;
  status?: string;
  statusKey?: string;
  active: boolean;
  icon: string;
  live?: boolean;
  usageCategory?: DeviceUsageCategory;
}
