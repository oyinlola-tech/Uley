export const PUSH_NOTIFICATION_LIMITS = {
  registrationRateLimitMaximum: 12,
  registrationRateLimitWindowMilliseconds: 60 * 60 * 1000,
  deliveryBatchSize: 100,
  deliveryPollMilliseconds: 5_000,
  receiptPollMilliseconds: 15 * 60 * 1000,
  deliveryLeaseMilliseconds: 2 * 60 * 1000,
  maximumDeliveryAttempts: 6,
  maximumReceiptAgeMilliseconds: 24 * 60 * 60 * 1000,
} as const;

export const PUSH_NOTIFICATION_MESSAGES = {
  defaultTitle: 'Uley update',
  defaultBody: 'You have a new update. Open Uley to see the details.',
} as const;

export const PUSH_DEVICE_RATE_LIMIT = {
  max: PUSH_NOTIFICATION_LIMITS.registrationRateLimitMaximum,
  timeWindow: PUSH_NOTIFICATION_LIMITS.registrationRateLimitWindowMilliseconds,
};
