import { LogIconType, LogTone, SecurityLogEntryResponse } from '../../infrastructure/security-response';

export interface SecurityLogEntry {
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

export function mapSecurityLogEntry(dto: SecurityLogEntryResponse): SecurityLogEntry {
  return { ...dto };
}
