import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_VIDEO_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';
import { COMPLAINT_LIMITS } from '../../../constants/complaint.constant.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { PayloadTooLargeError, ServiceUnavailableError, ValidationError } from '../../../errors/app.error.js';

export type ScannedComplaintVideo = {
  videoStorageKey: string; posterStorageKey: string; sha256: string; sizeBytes: number; durationSeconds: number; mediaType: string;
};
type MediaScanResponse = {
  video_storage_key: string; poster_storage_key: string; sha256: string; size_bytes: number;
  duration_seconds: number; media_type: string; scan_status: string;
};

export async function scanAndStoreComplaintVideo(complaintId: string, videoBytes: Buffer, contentType: string, fileName: string): Promise<ScannedComplaintVideo> {
  if (videoBytes.byteLength > COMPLAINT_LIMITS.evidenceVideoMaximumBytes) {
    throw new PayloadTooLargeError(ERROR_MESSAGES.complaintVideoTooLarge);
  }
  if (contentType !== 'video/mp4') {
    throw new ValidationError(ERROR_MESSAGES.complaintVideoRejected);
  }
  const { mediaServiceUrl, mediaServiceApiKey } = applicationEnvironment;
  if (!mediaServiceUrl || !mediaServiceApiKey) throw new ServiceUnavailableError(ERROR_MESSAGES.complaintVideoUploadUnavailable);
  const formData = new FormData();
  formData.append('video', new Blob([new Uint8Array(videoBytes)], { type: contentType }), fileName);
  try {
    const response = await fetch(`${mediaServiceUrl}${MEDIA_SERVICE_ENDPOINTS.complaintVideoScan}/${complaintId}/videos`, {
      method: 'POST', headers: { authorization: `Bearer ${mediaServiceApiKey}` }, body: formData,
      signal: AbortSignal.timeout(MEDIA_SERVICE_VIDEO_TIMEOUT_MS),
    });
    if (response.status === 413) throw new PayloadTooLargeError(ERROR_MESSAGES.complaintVideoTooLarge);
    if (response.status === 415 || response.status === 422) throw new ValidationError(ERROR_MESSAGES.complaintVideoRejected);
    if (!response.ok) throw new ServiceUnavailableError(ERROR_MESSAGES.complaintVideoUploadUnavailable);
    const result = await response.json() as MediaScanResponse;
    if (result.scan_status !== 'CLEAN' || result.media_type !== 'video/mp4') throw new ValidationError(ERROR_MESSAGES.complaintVideoRejected);
    return {
      videoStorageKey: result.video_storage_key, posterStorageKey: result.poster_storage_key, sha256: result.sha256,
      sizeBytes: result.size_bytes, durationSeconds: result.duration_seconds, mediaType: result.media_type,
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PayloadTooLargeError || error instanceof ServiceUnavailableError) throw error;
    throw new ServiceUnavailableError(ERROR_MESSAGES.complaintVideoUploadUnavailable);
  }
}
