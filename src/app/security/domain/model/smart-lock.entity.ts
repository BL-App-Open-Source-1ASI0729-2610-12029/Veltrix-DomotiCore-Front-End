import { SmartLockResponse } from '../../infrastructure/security-response';

export interface SmartLock {
  id: string;
  nameKey: string;
  iconUrl: string;
  secured: boolean;
  active: boolean;
}

export function mapSmartLock(dto: SmartLockResponse): SmartLock {
  return { ...dto };
}
