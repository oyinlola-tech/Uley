export const INSPECTION_LOCATION_COPY = {
  share: 'Share my live location for this inspection',
  stop: 'Stop sharing location',
  waiting: 'Waiting for the student to share their location.',
  stale: 'The latest shared location is no longer current.',
  locationPrefix: 'Last location update',
  openMap: 'Open shared location in maps',
  consent: 'Only the latest location is kept. Sharing can be stopped at any time.',
} as const;

export const INSPECTION_LOCATION_UPDATE_INTERVAL_MS = 10_000;
export const INSPECTION_LOCATION_POLL_INTERVAL_MS = 8_000;
