import { GOOGLE_ICONS } from '../../../shared/constants/google-icons';

export type AccountType = 'smart-home' | 'small-business';

export interface AccountTypeOption {
  id: AccountType;
  titleKey: string;
  descriptionKey: string;
  featuresKey: string;
  icon: string;
}

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    id: 'smart-home',
    titleKey: 'onboarding.accountTypes.smartHome.title',
    descriptionKey: 'onboarding.accountTypes.smartHome.description',
    featuresKey: 'onboarding.accountTypes.smartHome.features',
    icon: GOOGLE_ICONS.home,
  },
  {
    id: 'small-business',
    titleKey: 'onboarding.accountTypes.smallBusiness.title',
    descriptionKey: 'onboarding.accountTypes.smallBusiness.description',
    featuresKey: 'onboarding.accountTypes.smallBusiness.features',
    icon: GOOGLE_ICONS.briefcase,
  },
];

export function getAccountTypeRoute(type: AccountType): string {
  return type === 'smart-home'
    ? '/app/dashboard'
    : '/app/operations-hub';
}

export function isOnboardingComplete(
  accountType?: AccountType,
  onboardingCompleted?: boolean,
  role?: string,
): boolean {
  const normalizedRole = (role ?? '').trim().toLowerCase();
  if (normalizedRole === 'admin') {
    return true;
  }
  return !!accountType && onboardingCompleted !== false;
}
