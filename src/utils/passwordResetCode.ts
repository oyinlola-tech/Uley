import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { applicationEnvironment } from '../configs/env.config.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';

export function createPasswordResetCode(): string {
  const codeUpperBound = 10 ** AUTH_SECURITY_CONSTANTS.passwordResetCodeDigits;
  return String(randomInt(0, codeUpperBound)).padStart(AUTH_SECURITY_CONSTANTS.passwordResetCodeDigits, '0');
}

export function hashPasswordResetCode(emailAddress: string, oneTimeCode: string): string {
  return createHmac('sha256', applicationEnvironment.accessTokenSecret)
    .update(`${emailAddress}:${oneTimeCode}`)
    .digest('hex');
}

export function passwordResetCodeMatches(oneTimeCode: string, savedCodeHash: string, emailAddress: string): boolean {
  const submittedCodeHash = Buffer.from(hashPasswordResetCode(emailAddress, oneTimeCode), 'hex');
  const storedCodeHash = Buffer.from(savedCodeHash, 'hex');
  return submittedCodeHash.length === storedCodeHash.length && timingSafeEqual(submittedCodeHash, storedCodeHash);
}

export function createPasswordResetToken(): string {
  return randomBytes(AUTH_SECURITY_CONSTANTS.passwordResetTokenLengthInBytes).toString('base64url');
}

export function hashPasswordResetToken(resetToken: string): string {
  return createHash('sha256').update(resetToken).digest('hex');
}
