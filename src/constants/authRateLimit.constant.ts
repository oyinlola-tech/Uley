export const AUTH_RATE_LIMITS = {
  registration: { max: 5, timeWindow: '1 minute' },
  login: { max: 10, timeWindow: '1 minute' },
  recoveryRequest: { max: 3, timeWindow: '15 minutes' },
  recoveryVerify: { max: 10, timeWindow: '1 minute' },
  recoveryConfirm: { max: 5, timeWindow: '1 minute' },
  refresh: { max: 30, timeWindow: '1 minute' },
} as const;
