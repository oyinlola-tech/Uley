import { z } from 'zod';
import { AuthClientType } from '../enums/authClientType.enum.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';
import { AUTH_VALIDATION_LIMITS } from '../constants/authValidation.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

const normalizedEmailAddressSchema = z.string().trim().toLowerCase().email().max(AUTH_VALIDATION_LIMITS.emailMaximumLength);
const accountPasswordSchema = z.string().min(AUTH_VALIDATION_LIMITS.passwordMinimumLength).max(AUTH_VALIDATION_LIMITS.passwordMaximumLength);
const clientTypeSchema = z.enum(AuthClientType).default(AuthClientType.BROWSER);
const unlistedUniversitySchema = z.object({
  name: z.string().trim().min(3).max(180),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
}).strict();

export const registerStudentRequestSchema = z.object({
  universityId: z.uuid().optional(),
  unlistedUniversity: unlistedUniversitySchema.optional(),
  emailAddress: normalizedEmailAddressSchema,
  fullName: z.string().trim().min(AUTH_VALIDATION_LIMITS.fullNameMinimumLength).max(AUTH_VALIDATION_LIMITS.fullNameMaximumLength),
  password: accountPasswordSchema,
}).strict().refine((registration) => Boolean(registration.universityId) !== Boolean(registration.unlistedUniversity), {
  message: ERROR_MESSAGES.universitySelectionRequired,
});

export const registerLandlordRequestSchema = registerStudentRequestSchema;
export const registerCaretakerRequestSchema = z.object({
  emailAddress: normalizedEmailAddressSchema,
  fullName: z.string().trim().min(AUTH_VALIDATION_LIMITS.fullNameMinimumLength).max(AUTH_VALIDATION_LIMITS.fullNameMaximumLength),
  password: accountPasswordSchema,
}).strict();
export const registerBusinessAdvertiserRequestSchema = z.object({
  fullName: z.string().trim().min(AUTH_VALIDATION_LIMITS.fullNameMinimumLength).max(AUTH_VALIDATION_LIMITS.fullNameMaximumLength),
  emailAddress: normalizedEmailAddressSchema,
  password: accountPasswordSchema,
  businessName: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(120),
  websiteUrl: z.url().max(500).optional().or(z.literal('')),
}).strict();

export const logInWithPasswordRequestSchema = z.object({
  emailAddress: normalizedEmailAddressSchema,
  password: z.string().min(1).max(AUTH_VALIDATION_LIMITS.passwordMaximumLength),
  clientType: clientTypeSchema,
}).strict();

export const refreshAuthenticatedSessionRequestSchema = z.object({
  refreshToken: z.string().min(AUTH_VALIDATION_LIMITS.tokenMinimumLength).max(AUTH_VALIDATION_LIMITS.tokenMaximumLength).optional(),
  clientType: clientTypeSchema,
}).strict();

export const changeAccountPasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(AUTH_VALIDATION_LIMITS.passwordMaximumLength),
  newPassword: accountPasswordSchema,
}).strict();

export const requestPasswordResetCodeRequestSchema = z.object({
  emailAddress: normalizedEmailAddressSchema,
}).strict();

export const verifyPasswordResetCodeRequestSchema = z.object({
  emailAddress: normalizedEmailAddressSchema,
  oneTimeCode: z.string().regex(new RegExp(`^\\d{${AUTH_SECURITY_CONSTANTS.passwordResetCodeDigits}}$`)),
}).strict();

export const resetAccountPasswordRequestSchema = z.object({
  resetToken: z.string().min(AUTH_VALIDATION_LIMITS.tokenMinimumLength).max(AUTH_VALIDATION_LIMITS.tokenMaximumLength),
  newPassword: accountPasswordSchema,
}).strict();
