export type AccessLevel = 'admin' | 'member' | 'guest';
export type LogIconType = 'enter' | 'exit' | 'alert' | 'lock';
export type LogTone = 'success' | 'neutral' | 'danger';

export interface SecurityCameraResponse {
  id: string;
  labelKey: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface SmartLockResponse {
  id: string;
  nameKey: string;
  iconUrl: string;
  secured: boolean;
  active: boolean;
}

export interface AuthorizedUserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  accessLevel: AccessLevel;
  lastEntry: string;
  expiresIn?: string;
}

export interface SecurityLogEntryResponse {
  id: string;
  titleKey: string;
  locationKey: string;
  time: string;
  iconType: LogIconType;
  tone: LogTone;
  snapshotUrl?: string;
  snapshotLabelKey?: string;
  actionKey?: string;
}
