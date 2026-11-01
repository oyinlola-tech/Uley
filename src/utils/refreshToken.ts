import { createHash, randomBytes } from 'node:crypto';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';

export function createOpaqueRefreshToken(): string {
  return randomBytes(AUTH_SECURITY_CONSTANTS.opaqueRefreshTokenLengthInBytes).toString('base64url');
}

export function hashOpaqueRefreshToken(opaqueRefreshToken: string): string {
  return createHash('sha256').update(opaqueRefreshToken).digest('hex');
}
