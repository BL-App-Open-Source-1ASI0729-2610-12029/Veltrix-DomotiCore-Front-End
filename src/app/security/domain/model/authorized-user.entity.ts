import { AccessLevel, AuthorizedUserResponse } from '../../infrastructure/security-response';

export interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  accessLevel: AccessLevel;
  lastEntry: string;
  expiresIn?: string;
}

export function mapAuthorizedUser(dto: AuthorizedUserResponse): AuthorizedUser {
  return { ...dto };
}

export function toAuthorizedUserResponse(user: AuthorizedUser): AuthorizedUserResponse {
  return { ...user };
}
