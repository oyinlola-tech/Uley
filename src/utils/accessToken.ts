import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { applicationEnvironment } from '../configs/env.config.js';
import { UnauthorizedError } from '../errors/app.error.js';
import { UserRole } from '../enums/userRole.enum.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import type { UserRole as UserRoleType } from '../enums/userRole.enum.js';

interface AccessTokenHeader {
  alg: typeof AUTH_SECURITY_CONSTANTS.accessTokenAlgorithm;
  typ: typeof AUTH_SECURITY_CONSTANTS.accessTokenType;
}

export interface AccessTokenClaims {
  sub: string;
  sid: string;
  role: UserRoleType;
  iss: typeof AUTH_SECURITY_CONSTANTS.accessTokenIssuer;
  aud: typeof AUTH_SECURITY_CONSTANTS.accessTokenAudience;
  iat: number;
  exp: number;
  jti: string;
}

function encodeJsonAsBase64Url(jsonValue: object): string {
  return Buffer.from(JSON.stringify(jsonValue)).toString('base64url');
}

function createJwtSignature(unsignedJsonWebToken: string): Buffer {
  return createHmac('sha256', applicationEnvironment.accessTokenSecret)
    .update(unsignedJsonWebToken)
    .digest();
}

export function createSignedAccessToken(userId: string, authSessionId: string, userRole: UserRoleType): string {
  const issuedAtInUnixSeconds = Math.floor(Date.now() / 1000);
  const accessTokenHeader: AccessTokenHeader = { alg: AUTH_SECURITY_CONSTANTS.accessTokenAlgorithm, typ: AUTH_SECURITY_CONSTANTS.accessTokenType };
  const accessTokenClaims: AccessTokenClaims = {
    sub: userId,
    sid: authSessionId,
    role: userRole,
    iss: AUTH_SECURITY_CONSTANTS.accessTokenIssuer,
    aud: AUTH_SECURITY_CONSTANTS.accessTokenAudience,
    iat: issuedAtInUnixSeconds,
    exp: issuedAtInUnixSeconds + applicationEnvironment.accessTokenLifetimeInSeconds,
    jti: randomUUID(),
  };
  const unsignedJsonWebToken = `${encodeJsonAsBase64Url(accessTokenHeader)}.${encodeJsonAsBase64Url(accessTokenClaims)}`;
  return `${unsignedJsonWebToken}.${createJwtSignature(unsignedJsonWebToken).toString('base64url')}`;
}

export function verifySignedAccessToken(signedAccessToken: string): AccessTokenClaims {
  const [encodedHeader, encodedClaims, encodedSignature, extraTokenSegment] = signedAccessToken.split('.');
  if (!encodedHeader || !encodedClaims || !encodedSignature || extraTokenSegment) {
    throw new UnauthorizedError(ERROR_MESSAGES.accessTokenInvalid);
  }

  let accessTokenHeader: AccessTokenHeader;
  let accessTokenClaims: AccessTokenClaims;
  let suppliedSignature: Buffer;
  try {
    accessTokenHeader = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as AccessTokenHeader;
    accessTokenClaims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')) as AccessTokenClaims;
    suppliedSignature = Buffer.from(encodedSignature, 'base64url');
  } catch {
    throw new UnauthorizedError(ERROR_MESSAGES.accessTokenInvalid);
  }

  const unsignedJsonWebToken = `${encodedHeader}.${encodedClaims}`;
  const expectedSignature = createJwtSignature(unsignedJsonWebToken);
  if (accessTokenHeader.alg !== AUTH_SECURITY_CONSTANTS.accessTokenAlgorithm || accessTokenHeader.typ !== AUTH_SECURITY_CONSTANTS.accessTokenType
    || suppliedSignature.length !== expectedSignature.length
    || !timingSafeEqual(suppliedSignature, expectedSignature)) {
    throw new UnauthorizedError(ERROR_MESSAGES.accessTokenInvalid);
  }

  const currentUnixTimeInSeconds = Math.floor(Date.now() / 1000);
  if (typeof accessTokenClaims.sub !== 'string' || typeof accessTokenClaims.sid !== 'string'
    || typeof accessTokenClaims.iat !== 'number' || typeof accessTokenClaims.exp !== 'number'
    || !Object.values(UserRole).includes(accessTokenClaims.role)
    || typeof accessTokenClaims.jti !== 'string'
    || !Number.isFinite(accessTokenClaims.exp) || !Number.isFinite(accessTokenClaims.iat)
    || accessTokenClaims.iss !== AUTH_SECURITY_CONSTANTS.accessTokenIssuer || accessTokenClaims.aud !== AUTH_SECURITY_CONSTANTS.accessTokenAudience
    || accessTokenClaims.exp <= currentUnixTimeInSeconds
    || accessTokenClaims.iat > currentUnixTimeInSeconds + AUTH_SECURITY_CONSTANTS.accessTokenFutureIssuedAtToleranceInSeconds) {
    throw new UnauthorizedError(ERROR_MESSAGES.accessTokenInvalid);
  }

  return accessTokenClaims;
}
