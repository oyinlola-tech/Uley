import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { UserRole } from '../../../enums/userRole.enum.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import type { UserRole as UserRoleType } from '../../../enums/userRole.enum.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';

export interface AuthenticatedUserResponse {
  id: string;
  emailAddress: string;
  fullName: string;
  userRole: UserRoleType;
  universityId: string | null;
  createdAt: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: typeof AUTH_SECURITY_CONSTANTS.bearerTokenType;
  expiresInSeconds: number;
  authenticatedUser: AuthenticatedUserResponse;
  refreshToken?: string;
}

export function getApplicationUserRoleFromDatabaseRole(databaseUserRole: string): UserRoleType {
  if (!Object.values(UserRole).includes(databaseUserRole as UserRoleType)) {
    throw new UnauthorizedError(ERROR_MESSAGES.unsupportedAccountRole);
  }
  return databaseUserRole as UserRoleType;
}

export function mapDatabaseUserToAuthenticatedUserResponse(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  universityId?: string | null;
  createdAt: Date;
}): AuthenticatedUserResponse {
  return {
    id: user.id,
    emailAddress: user.email,
    fullName: user.fullName,
    userRole: getApplicationUserRoleFromDatabaseRole(user.role),
    universityId: user.universityId ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
