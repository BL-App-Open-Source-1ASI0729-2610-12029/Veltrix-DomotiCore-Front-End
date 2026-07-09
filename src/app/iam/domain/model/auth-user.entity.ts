import { AccountType } from './account-type.entity';

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string;
  avatarSeed?: string;
  username?: string;
  accountType?: AccountType;
  onboardingCompleted?: boolean;
}

export function stripPassword(user: AuthUser): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function createLocalUser(name: string, email: string, password: string): AuthUser {
  return {
    id: `local-${Date.now()}`,
    name,
    email,
    password,
    role: 'User',
    onboardingCompleted: false,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3455d1&color=ffffff`,
  };
}
