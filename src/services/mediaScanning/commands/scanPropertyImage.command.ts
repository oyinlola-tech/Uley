import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { ServiceUnavailableError, ValidationError } from '../../../errors/app.error.js';

export type ScannedImage = { storageKey: string; sha256: string; mediaType: string; width: number; height: number; scannedAt: Date };
type MediaScanResponse = { storage_key: string; sha256: string; media_type: string; width: number; height: number; scan_status: string };

async function scanAndStoreImage(ownerId: string, imageBytes: Buffer, contentType: string, fileName: string, scope: 'properties' | 'advertisements'): Promise<ScannedImage> {
  const serviceUrl = applicationEnvironment.mediaServiceUrl;
  const serviceApiKey = applicationEnvironment.mediaServiceApiKey;
  if (!serviceUrl || !serviceApiKey) throw new ServiceUnavailableError();
  const imageForm = new FormData();
  imageForm.append('image', new Blob([new Uint8Array(imageBytes)], { type: contentType }), fileName);
  try {
    const prefix = scope === 'properties' ? MEDIA_SERVICE_ENDPOINTS.imageScanPrefix : MEDIA_SERVICE_ENDPOINTS.advertisementImageScanPrefix;
    const response = await fetch(`${serviceUrl}${prefix}/${ownerId}/images`, {
      method: 'POST', headers: { authorization: `Bearer ${serviceApiKey}` }, body: imageForm,
      signal: AbortSignal.timeout(MEDIA_SERVICE_TIMEOUT_MS),
    });
    if (response.status === 422 || response.status === 413 || response.status === 415) throw new ValidationError(ERROR_MESSAGES.propertyImageRejected);
    if (!response.ok) throw new ServiceUnavailableError();
    const result = await response.json() as MediaScanResponse;
    if (result.scan_status !== 'CLEAN') throw new ValidationError(ERROR_MESSAGES.propertyImageRejected);
    return { storageKey: result.storage_key, sha256: result.sha256, mediaType: result.media_type, width: result.width, height: result.height, scannedAt: new Date() };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ServiceUnavailableError) throw error;
    throw new ServiceUnavailableError();
  }
}

export function scanAndStorePropertyImage(propertyId: string, imageBytes: Buffer, contentType: string, fileName: string): Promise<ScannedImage> {
  return scanAndStoreImage(propertyId, imageBytes, contentType, fileName, 'properties');
}

export function scanAndStoreAdvertisementImage(advertisementId: string, imageBytes: Buffer, contentType: string, fileName: string): Promise<ScannedImage> {
  return scanAndStoreImage(advertisementId, imageBytes, contentType, fileName, 'advertisements');
}
