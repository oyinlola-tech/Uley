import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../errors/app.error.js';
import { verifySignedAccessToken } from '../utils/accessToken.js';
import { verifyAuthenticatedSession } from '../services/auth/index.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';

export async function requireAuthenticatedUser(
  fastifyRequest: FastifyRequest,
  _fastifyReply: FastifyReply,
): Promise<void> {
  const authorizationHeader = fastifyRequest.headers.authorization;
  const bearerTokenPrefix = `${AUTH_SECURITY_CONSTANTS.bearerTokenType} `;
  if (!authorizationHeader?.startsWith(bearerTokenPrefix)) {
    throw new UnauthorizedError(ERROR_MESSAGES.bearerTokenRequired);
  }
  const bearerAccessToken = authorizationHeader.slice(bearerTokenPrefix.length).trim();
  if (!bearerAccessToken) throw new UnauthorizedError(ERROR_MESSAGES.bearerTokenRequired);

  const accessTokenClaims = verifySignedAccessToken(bearerAccessToken);
  const authenticatedUser = await verifyAuthenticatedSession(accessTokenClaims.sid, accessTokenClaims.sub);
  if (authenticatedUser.userRole !== accessTokenClaims.role) {
    throw new UnauthorizedError(ERROR_MESSAGES.accountRoleMismatch);
  }
  fastifyRequest.authenticatedUser = authenticatedUser;
  fastifyRequest.authSessionId = accessTokenClaims.sid;
}
