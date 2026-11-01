export const MEDIA_SERVICE_TIMEOUT_MS = 45_000;
export const MEDIA_SERVICE_UPLOAD_TIMEOUT_MS = 120_000;
export const MEDIA_SERVICE_VIDEO_TIMEOUT_MS = 120_000;
export const MEDIA_SERVICE_MAX_SIGNED_URLS_PER_REQUEST = 100;
export const PROPERTY_IMAGE_SCAN_QUEUE = {
  pollIntervalMilliseconds: 2_000,
  leaseDurationMilliseconds: 3 * 60 * 1_000,
  maximumAttempts: 8,
  maximumRetryDelayMilliseconds: 60 * 60 * 1_000,
  clientPollIntervalMilliseconds: 1_000,
  clientMaximumWaitMilliseconds: 90_000,
} as const;
export const COMPLAINT_VIDEO_SCAN_QUEUE = {
  pollIntervalMilliseconds: 2_500,
  leaseDurationMilliseconds: 3 * 60 * 1_000,
  maximumAttempts: 8,
  maximumRetryDelayMilliseconds: 60 * 60 * 1_000,
} as const;

export const MEDIA_SERVICE_ENDPOINTS = {
  imageScanPrefix: '/internal/v1/properties',
  advertisementImageScanPrefix: '/internal/v1/advertisements',
  signedImageUrls: '/internal/v1/images/signed-urls',
  deleteImage: '/internal/v1/images/delete',
  complaintVideoScan: '/internal/v1/complaints',
  complaintMediaSignedUrls: '/internal/v1/complaints/media/signed-urls',
  multipartUploadSessions: '/internal/v1/property-upload-sessions',
} as const;
