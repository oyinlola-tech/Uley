export const WEB_PROPERTY_IMAGE_UPLOAD = {
  acceptedContentTypes: 'image/jpeg,image/png,image/webp',
  maximumFileSizeBytes: 10 * 1024 * 1024,
  maximumImagesPerProperty: 12,
  uploadChunkSizeBytes: 1024 * 1024,
  maximumChunkRetries: 3,
  scanPollIntervalMilliseconds: 1_000,
  scanMaximumWaitMilliseconds: 90_000,
} as const;
