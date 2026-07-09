import { GOOGLE_ICONS } from '../../../shared/constants/google-icons';

export interface AccountNavItem {
  icon: string;
  labelKey: string;
  route: string;
  badge?: number;
}

export const SMART_HOME_NAV_ITEMS: AccountNavItem[] = [
  { icon: GOOGLE_ICONS.dashboard, labelKey: 'navigation.dashboard', route: '/app/dashboard' },
  { icon: GOOGLE_ICONS.security, labelKey: 'navigation.security', route: '/app/security' },
  { icon: GOOGLE_ICONS.devices, labelKey: 'navigation.devices', route: '/app/devices' },
  { icon: GOOGLE_ICONS.automation, labelKey: 'navigation.automation', route: '/app/automation' },
  { icon: GOOGLE_ICONS.history, labelKey: 'navigation.history', route: '/app/history' },
  { icon: GOOGLE_ICONS.settings, labelKey: 'navigation.settings', route: '/app/settings' },
];

export const SMALL_BUSINESS_NAV_ITEMS: AccountNavItem[] = [
  { icon: GOOGLE_ICONS.dashboard, labelKey: 'navigation.dashboard', route: '/app/operations-hub' },
  { icon: GOOGLE_ICONS.devices, labelKey: 'navigation.devices', route: '/app/devices' },
  { icon: GOOGLE_ICONS.automation, labelKey: 'navigation.automation', route: '/app/automation' },
  { icon: GOOGLE_ICONS.assessment, labelKey: 'navigation.reports', route: '/app/reports' },
  { icon: GOOGLE_ICONS.groups, labelKey: 'navigation.users', route: '/app/users' },
];
