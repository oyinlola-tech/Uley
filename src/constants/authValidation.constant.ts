export const AUTH_VALIDATION_LIMITS = {
  emailMinimumLength: 3,
  emailMaximumLength: 320,
  passwordMinimumLength: 12,
  passwordMaximumLength: 128,
  fullNameMinimumLength: 2,
  fullNameMaximumLength: 160,
  tokenMinimumLength: 32,
  tokenMaximumLength: 128,
} as const;
