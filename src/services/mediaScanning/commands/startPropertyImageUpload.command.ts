import { randomUUID } from 'node:crypto';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { PropertyStatus, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../../../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { PROPERTY_IMAGE_LIMITS } from '../../../constants/propertyImage.constant.js';
import { createImageUploadSession } from '../../../utils/propertyImageUpload.storage.js';
import { MediaStorageBackend } from '../../../enums/mediaStorageBackend.enum.js';
import { createPropertyImageUploadSession } from '../../../repositories/propertyImageUploadSession.repository.js';
import { discardSharedPropertyImageUpload, startSharedPropertyImageUpload } from './sharedPropertyImageUpload.provider.js';

export async function startPropertyImageUpload(input: { propertyId: string; landlordId: string; fileName: string; contentType: string; fileSize: number; altText: string }) {
  const property = await prismaDatabaseClient.property.findFirst({
    where: { id: input.propertyId, landlordId: input.landlordId },
    select: { status: true, landlord: { select: { landlordVerification: { select: { status: true } } } }, _count: { select: { images: true } } },
  });
  if (!property) throw new NotFoundError();
  if (property.status !== PropertyStatus.DRAFT) throw new ConflictError(ERROR_MESSAGES.propertyImageUploadRequiresDraft);
  if (property.landlord.landlordVerification?.status !== VerificationStatus.APPROVED) throw new ConflictError(ERROR_MESSAGES.landlordVerificationRequired);
  if (property._count.images >= PROPERTY_IMAGE_LIMITS.maximumImagesPerProperty) throw new ConflictError(ERROR_MESSAGES.propertyImageLimitReached);
  if (applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3) {
    const totalChunks = Math.ceil(input.fileSize / PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes);
    return createSharedImageUploadSession(input, totalChunks);
  }
  const totalChunks = Math.ceil(input.fileSize / PROPERTY_IMAGE_LIMITS.uploadChunkSizeBytes);
  return createImageUploadSession({ ...input, totalChunks });
}

async function createSharedImageUploadSession(input: { propertyId: string; landlordId: string; fileName: string; contentType: string; fileSize: number; altText: string }, totalChunks: number) {
  const uploadId = randomUUID();
  const expiresAt = new Date(Date.now() + PROPERTY_IMAGE_LIMITS.uploadSessionLifetimeMilliseconds);
  const providerUploadId = await startSharedPropertyImageUpload(uploadId, input.contentType);
  try {
    await createPropertyImageUploadSession({ ...input, uploadId, providerUploadId, totalChunks, expiresAt });
  } catch (error) {
    await discardSharedPropertyImageUpload(uploadId, providerUploadId).catch(() => undefined);
    throw error;
  }
  return { ...input, uploadId, totalChunks, chunkSizeBytes: PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes, expiresAt: expiresAt.toISOString(), uploadedChunks: [] };
}
