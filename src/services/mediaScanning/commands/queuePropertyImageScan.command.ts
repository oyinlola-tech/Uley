import { assembleImageUpload, discardImageUploadChunks, isValidPropertyImageUploadId, readImageUploadSession } from '../../../utils/propertyImageUpload.storage.js';
import { createPropertyImageScanJob, getOwnedPropertyImageScanJob } from '../../../repositories/propertyImageScanJob.repository.js';
import { NotFoundError, ValidationError } from '../../../errors/app.error.js';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { MediaStorageBackend } from '../../../enums/mediaStorageBackend.enum.js';
import { deletePropertyImageUploadSession, findOwnedPropertyImageUploadSession } from '../../../repositories/propertyImageUploadSession.repository.js';
import { completeSharedPropertyImageUpload, discardSharedPropertyImageUpload } from './sharedPropertyImageUpload.provider.js';
import { PROPERTY_IMAGE_LIMITS } from '../../../constants/propertyImage.constant.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';

export async function queuePropertyImageScan(input: { uploadId: string; propertyId: string; landlordId: string }) {
  if (!isValidPropertyImageUploadId(input.uploadId)) throw new NotFoundError();
  const existingJob = await getOwnedPropertyImageScanJob(input.uploadId, input.propertyId, input.landlordId);
  if (existingJob) {
    if (applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3) {
      await cleanupSharedUploadSession(input.uploadId, input.propertyId, input.landlordId);
    }
    return { uploadId: existingJob.uploadId, scanStatus: existingJob.status };
  }
  if (applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3) {
    return queueSharedImageScan(input);
  }
  const manifest = await readImageUploadSession(input.uploadId, input.landlordId, input.propertyId);
  const job = await createPropertyImageScanJob({
    uploadId: input.uploadId, propertyId: input.propertyId, landlordId: input.landlordId,
    fileName: manifest.fileName, contentType: manifest.contentType, altText: manifest.altText,
    sourceBytes: await assembleImageUpload(manifest),
  });
  await discardImageUploadChunks(manifest);
  return { uploadId: job.uploadId, scanStatus: job.status };
}

async function queueSharedImageScan(input: { uploadId: string; propertyId: string; landlordId: string }) {
  const session = await findOwnedPropertyImageUploadSession(input.uploadId, input.propertyId, input.landlordId);
  if (!session) throw new NotFoundError();
  if (session.expiresAt.getTime() < Date.now()) {
    await cleanupSharedUploadSession(input.uploadId, input.propertyId, input.landlordId);
    throw new ValidationError(ERROR_MESSAGES.propertyImageUploadExpired);
  }
  const sourceBytes = await completeSharedPropertyImageUpload(input.uploadId, session.providerUploadId, session.totalChunks);
  if (sourceBytes.length !== session.fileSize || sourceBytes.length > PROPERTY_IMAGE_LIMITS.maximumFileSizeBytes) {
    throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
  }
  const job = await createPropertyImageScanJob({
    uploadId: input.uploadId, propertyId: input.propertyId, landlordId: input.landlordId,
    fileName: session.fileName, contentType: session.contentType, altText: session.altText, sourceBytes,
  });
  await cleanupSharedUploadSession(input.uploadId, input.propertyId, input.landlordId);
  return { uploadId: job.uploadId, scanStatus: job.status };
}

async function cleanupSharedUploadSession(uploadId: string, propertyId: string, landlordId: string) {
  const session = await findOwnedPropertyImageUploadSession(uploadId, propertyId, landlordId);
  if (!session) return;
  await discardSharedPropertyImageUpload(uploadId, session.providerUploadId).catch(() => undefined);
  await deletePropertyImageUploadSession(uploadId);
}
