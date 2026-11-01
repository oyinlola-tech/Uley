export const PROPERTY_IMAGE_LIMITS = {
  maximumFileSizeBytes: 10 * 1024 * 1024,
  uploadChunkSizeBytes: 1024 * 1024,
  sharedUploadChunkSizeBytes: 5 * 1024 * 1024,
  uploadSessionLifetimeMilliseconds: 24 * 60 * 60 * 1000,
  expiredSessionCleanupIntervalMilliseconds: 5 * 60 * 1000,
  expiredSessionCleanupBatchSize: 20,
  maximumImagesPerProperty: 12,
  acceptedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
  altTextMaximumLength: 255,
  uploadRateLimitMaximum: 20,
  uploadRateLimitWindowMilliseconds: 60 * 60 * 1000,
  uploadChunkRateLimitMaximum: 300,
} as const;
