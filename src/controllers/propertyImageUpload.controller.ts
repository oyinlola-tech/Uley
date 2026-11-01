import type { FastifyReply, FastifyRequest } from 'fastify';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';
import { applicationEnvironment } from '../configs/env.config.js';
import { MediaStorageBackend } from '../enums/mediaStorageBackend.enum.js';
import { UserRole } from '../enums/userRole.enum.js';
import { ForbiddenError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { completePropertyImageUpload, getPropertyImageUpload, startPropertyImageUpload, uploadPropertyImageChunk } from '../services/mediaScanning/index.js';
import { parsePropertyImageUploadRequest } from '../validations/propertyImage.validation.js';

function getUploadRouteParameters(request: FastifyRequest) {
  if (request.authenticatedUser?.userRole !== UserRole.LANDLORD) throw new ForbiddenError();
  const parameters = request.params as { propertyId: string; uploadId?: string; chunkIndex?: string };
  return { propertyId: parameters.propertyId, uploadId: parameters.uploadId, landlordId: request.authenticatedUser.id, chunkIndex: parameters.chunkIndex };
}

export async function startPropertyImageUploadFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const parameters = getUploadRouteParameters(request);
  const parsedBody = parsePropertyImageUploadRequest(request.body);
  if (!parsedBody.success) throw new ValidationError(ERROR_MESSAGES.validationFailed);
  const upload = await startPropertyImageUpload({ ...parameters, ...parsedBody.data });
  const chunkSizeBytes = applicationEnvironment.mediaStorageBackend === MediaStorageBackend.S3
    ? PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes
    : upload.chunkSizeBytes ?? PROPERTY_IMAGE_LIMITS.uploadChunkSizeBytes;
  return reply.code(201).send({ uploadId: upload.uploadId, chunkSizeBytes, totalChunks: upload.totalChunks, expiresAt: upload.expiresAt });
}

export async function uploadPropertyImageChunkFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const parameters = getUploadRouteParameters(request);
  const file = await request.file({ limits: { files: 1, fileSize: PROPERTY_IMAGE_LIMITS.sharedUploadChunkSizeBytes } })
    .catch(() => { throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected); });
  const chunkIndex = Number(parameters.chunkIndex);
  if (!file || file.file.truncated || !Number.isInteger(chunkIndex) || chunkIndex < 0) throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
  const result = await uploadPropertyImageChunk({
    uploadId: parameters.uploadId ?? '', propertyId: parameters.propertyId, landlordId: parameters.landlordId,
    chunkIndex, chunkBytes: await file.toBuffer().catch(() => { throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected); }),
  });
  return reply.send(result);
}

export async function getPropertyImageUploadFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const parameters = getUploadRouteParameters(request);
  return reply.send(await getPropertyImageUpload(parameters.uploadId ?? '', parameters.propertyId, parameters.landlordId));
}

export async function completePropertyImageUploadFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const parameters = getUploadRouteParameters(request);
  const scanJob = await completePropertyImageUpload({ uploadId: parameters.uploadId ?? '', propertyId: parameters.propertyId, landlordId: parameters.landlordId });
  return reply.code(202).send(scanJob);
}
