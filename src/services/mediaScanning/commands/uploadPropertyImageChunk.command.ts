import { readImageUploadSession, storeImageUploadChunk } from '../../../utils/propertyImageUpload.storage.js';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { MediaStorageBackend } from '../../../enums/mediaStorageBackend.enum.js';
import { PROPERTY_IMAGE_LIMITS } from '../../../constants/propertyImage.constant.js';
import { ConflictError, ValidationError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { findOwnedPropertyImageUploadSession } from '../../../repositories/propertyImageUploadSession.repository.js';
import { getSharedPropertyImageUploadParts, uploadSharedPropertyImagePart } from './sharedPropertyImageUpload.provider.js';

export async function uploadPropertyImageChunk(input: { uploadId: string; propertyId: string; landlordId: string; chunkIndex: number; chunkBytes: Buffer }) {
  if (applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3) {
    return uploadSharedImagePart(input);
  }
  const manifest = await readImageUploadSession(input.uploadId, input.landlordId, input.propertyId);
  const updatedManifest = await storeImageUploadChunk(manifest, input.chunkIndex, input.chunkBytes);
  return { uploadId: updatedManifest.uploadId, uploadedChunks: updatedManifest.uploadedChunks, totalChunks: updatedManifest.totalChunks };
}

async function uploadSharedImagePart(input: { uploadId: string; propertyId: string; landlordId: string; chunkIndex: number; chunkBytes: Buffer }) {
  const session = await findOwnedPropertyImageUploadSession(input.uploadId, input.propertyId, input.landlordId);
  if (!session) throw new ConflictError(ERROR_MESSAGES.propertyImageUploadExpired);
  if (session.expiresAt.getTime() < Date.now()) throw new ValidationError(ERROR_MESSAGES.propertyImageUploadExpired);
  const expectedSize = Math.min(PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes, session.fileSize - input.chunkIndex * PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes);
  if (input.chunkIndex < 0 || input.chunkIndex >= session.totalChunks || input.chunkBytes.length !== expectedSize) {
    throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
  }
  await uploadSharedPropertyImagePart(input.uploadId, session.providerUploadId, input.chunkIndex + 1, input.chunkBytes);
  const uploadedParts = await getSharedPropertyImageUploadParts(input.uploadId, session.providerUploadId);
  return { uploadId: input.uploadId, uploadedChunks: uploadedParts.map((part) => part.part_number - 1), totalChunks: session.totalChunks };
}
