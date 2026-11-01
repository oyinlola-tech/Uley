import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { createSignedAccessToken } from '../../../utils/accessToken.js';
import { createOpaqueRefreshToken, hashOpaqueRefreshToken } from '../../../utils/refreshToken.js';
import { getApplicationUserRoleFromDatabaseRole, mapDatabaseUserToAuthenticatedUserResponse } from './authResponse.dto.js';
import type { AuthTokenResponse } from './authResponse.dto.js';
import type { RefreshAuthSessionCommand } from './refreshAuthSession.command.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';

const authRepository = new AuthRepository();

function createAuthSessionExpiryDate(): Date {
  const authSessionExpiryDate = new Date();
  authSessionExpiryDate.setDate(authSessionExpiryDate.getDate() + applicationEnvironment.refreshTokenLifetimeInDays);
  return authSessionExpiryDate;
}

export async function rotateAuthSessionAndIssueTokens(input: RefreshAuthSessionCommand): Promise<AuthTokenResponse> {
  const existingAuthSession = await authRepository.findActiveSessionByRefreshTokenHash(
    hashOpaqueRefreshToken(input.refreshToken),
  );
  if (!existingAuthSession) throw new UnauthorizedError(ERROR_MESSAGES.refreshTokenInvalid);

  const replacementRefreshToken = createOpaqueRefreshToken();
  const replacementRefreshTokenHash = hashOpaqueRefreshToken(replacementRefreshToken);
  const replacementSessionWasCreated = await authRepository.rotateAuthSession({
    oldSessionId: existingAuthSession.id,
    newRefreshTokenHash: replacementRefreshTokenHash,
    newExpiresAt: createAuthSessionExpiryDate(),
    userAgent: input.userAgent?.slice(0, AUTH_SECURITY_CONSTANTS.maximumUserAgentLength) ?? null,
    ipAddress: input.ipAddress,
  });
  if (!replacementSessionWasCreated) throw new UnauthorizedError(ERROR_MESSAGES.refreshTokenAlreadyUsed);

  const replacementAuthSession = await authRepository.findActiveSessionByRefreshTokenHash(replacementRefreshTokenHash);
  if (!replacementAuthSession) throw new UnauthorizedError(ERROR_MESSAGES.authSessionCreationFailed);
  return {
    accessToken: createSignedAccessToken(
      replacementAuthSession.user.id,
      replacementAuthSession.id,
      getApplicationUserRoleFromDatabaseRole(replacementAuthSession.user.role),
    ),
    tokenType: AUTH_SECURITY_CONSTANTS.bearerTokenType,
    expiresInSeconds: applicationEnvironment.accessTokenLifetimeInSeconds,
    authenticatedUser: mapDatabaseUserToAuthenticatedUserResponse(replacementAuthSession.user),
    refreshToken: replacementRefreshToken,
  };
}
