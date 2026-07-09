import { AccountType } from './account-type.entity';

const SMART_HOME_ONLY_SEGMENTS = new Set(['dashboard', 'security', 'history']);
const SMALL_BUSINESS_ONLY_SEGMENTS = new Set([
  'operations-hub',
  'reports',
  'users',
  'smart-integrations',
]);

export type AccessDenialReason = 'segment' | 'permission';

export function getRequiredSegment(url: string): AccountType | null {
  const normalized = url.split('?')[0].replace(/\/+$/, '');
  const segment = normalized.replace(/^\/app\/?/, '').split('/')[0];
  if (!segment) {
    return null;
  }
  if (SMART_HOME_ONLY_SEGMENTS.has(segment)) {
    return 'smart-home';
  }
  if (SMALL_BUSINESS_ONLY_SEGMENTS.has(segment)) {
    return 'small-business';
  }
  return null;
}

export function getSegmentAccessDenial(
  url: string,
  activeSegment: AccountType,
): AccountType | null {
  const required = getRequiredSegment(url);
  if (!required || required === activeSegment) {
    return null;
  }
  return required;
}
