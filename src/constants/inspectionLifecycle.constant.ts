export const INSPECTION_REMINDER_OFFSETS = [
  { key: '24h', milliseconds: 24 * 60 * 60 * 1000, label: 'tomorrow' },
  { key: '1h', milliseconds: 60 * 60 * 1000, label: 'in about an hour' },
] as const;

export const INSPECTION_NOTIFICATION_PAGE_SIZE = 50;
export const PROPERTY_REVIEW_PAGE_SIZE = 50;
