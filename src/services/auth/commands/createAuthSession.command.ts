import { applicationEnvironment } from '../../../configs/env.config.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { createSignedAccessToken } from '../../../utils/accessToken.js';
import { createOpaqueRefreshToken, hashOpaqueRefreshToken } from '../../../utils/refreshToken.js';
import { mapDatabaseUserToAuthenticatedUserResponse } from './authResponse.dto.js';
import type { AuthTokenResponse } from './authResponse.dto.js';
import type { UserRole } from '../../../enums/userRole.enum.js';
import { AuthClientType } from '../../../enums/authClientType.enum.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';

const authRepository = new AuthRepository();

function createAuthSessionExpiryDate(): Date {
  const authSessionExpiryDate = new Date();
  authSessionExpiryDate.setDate(authSessionExpiryDate.getDate() + applicationEnvironment.refreshTokenLifetimeInDays);
  return authSessionExpiryDate;
}

export async function createAuthSessionForUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}, input: {
  clientType: AuthClientType;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<AuthTokenResponse> {
  const opaqueRefreshToken = createOpaqueRefreshToken();
  const createdAuthSession = await authRepository.createAuthSession({
    userId: user.id,
    refreshTokenHash: hashOpaqueRefreshToken(opaqueRefreshToken),
    expiresAt: createAuthSessionExpiryDate(),
    userAgent: input.userAgent?.slice(0, AUTH_SECURITY_CONSTANTS.maximumUserAgentLength) ?? null,
    ipAddress: input.ipAddress,
  });
  return {
    accessToken: createSignedAccessToken(user.id, createdAuthSession.id, user.role),
    tokenType: AUTH_SECURITY_CONSTANTS.bearerTokenType,
    expiresInSeconds: applicationEnvironment.accessTokenLifetimeInSeconds,
    authenticatedUser: mapDatabaseUserToAuthenticatedUserResponse(user),
    refreshToken: opaqueRefreshToken,
  };
}
