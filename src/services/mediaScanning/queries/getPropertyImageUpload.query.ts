import { isValidPropertyImageUploadId, readImageUploadSession } from '../../../utils/propertyImageUpload.storage.js';
import { getOwnedPropertyImageScanJob } from '../../../repositories/propertyImageScanJob.repository.js';
import { NotFoundError } from '../../../errors/app.error.js';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { MediaStorageBackend } from '../../../enums/mediaStorageBackend.enum.js';
import { findOwnedPropertyImageUploadSession } from '../../../repositories/propertyImageUploadSession.repository.js';
import { getSharedPropertyImageUploadParts } from '../commands/sharedPropertyImageUpload.provider.js';
import { PROPERTY_IMAGE_LIMITS } from '../../../constants/propertyImage.constant.js';

export async function getPropertyImageUpload(uploadId: string, propertyId: string, landlordId: string) {
  if (!isValidPropertyImageUploadId(uploadId)) throw new NotFoundError();
  const scanJob = await getOwnedPropertyImageScanJob(uploadId, propertyId, landlordId);
  if (scanJob) return {
    uploadId, uploadedChunks: [], totalChunks: 0, scanStatus: scanJob.status,
    scanErrorCode: scanJob.lastErrorCode,
    completedImage: scanJob.propertyImage ? {
      id: scanJob.propertyImage.id, altText: scanJob.propertyImage.altText, width: scanJob.propertyImage.width,
      height: scanJob.propertyImage.height, mediaType: scanJob.propertyImage.mediaType,
    } : null,
  };
  if (applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3) {
    const session = await findOwnedPropertyImageUploadSession(uploadId, propertyId, landlordId);
    if (!session) throw new NotFoundError();
    if (session.expiresAt.getTime() < Date.now()) throw new NotFoundError();
    const parts = await getSharedPropertyImageUploadParts(uploadId, session.providerUploadId);
    return { uploadId, uploadedChunks: parts.map((part) => part.part_number - 1), totalChunks: session.totalChunks, chunkSizeBytes: PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes, scanStatus: null, completedImage: null };
  }
  const manifest = await readImageUploadSession(uploadId, landlordId, propertyId);
  return { uploadId, uploadedChunks: manifest.uploadedChunks, totalChunks: manifest.totalChunks, chunkSizeBytes: manifest.chunkSizeBytes ?? PROPERTY_IMAGE_LIMITS.uploadChunkSizeBytes, scanStatus: null, completedImage: manifest.completedImage ?? null };
}
