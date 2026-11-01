export const MOBILE_PROPERTY_IMAGE_UPLOAD = {
  maximumFileSizeBytes: 10 * 1024 * 1024,
  maximumImagesPerProperty: 12,
  chunkSizeBytes: 1024 * 1024,
  maximumChunkRetries: 3,
  scanPollIntervalMilliseconds: 1_000,
  scanMaximumWaitMilliseconds: 90_000,
} as const;
