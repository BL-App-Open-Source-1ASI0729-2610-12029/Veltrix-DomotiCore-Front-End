import { SecurityCameraResponse } from '../../infrastructure/security-response';

export interface SecurityCamera {
  id: string;
  labelKey: string;
  imageUrl: string;
  isPrimary: boolean;
}

export function mapSecurityCamera(dto: SecurityCameraResponse): SecurityCamera {
  return { ...dto };
}
