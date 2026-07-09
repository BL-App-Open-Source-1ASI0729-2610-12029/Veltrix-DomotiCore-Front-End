import { CameraMediaType, SecurityCameraResponse } from '../../infrastructure/security-response';

export interface SecurityCamera {
  id: string;
  labelKey: string;
  imageUrl: string;
  streamUrl?: string;
  mediaType?: CameraMediaType;
  isPrimary: boolean;
}

export function mapSecurityCamera(dto: SecurityCameraResponse): SecurityCamera {
  return { ...dto };
}
