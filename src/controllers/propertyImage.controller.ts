import type { FastifyReply, FastifyRequest } from 'fastify';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { ForbiddenError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { addScannedPropertyImage } from '../repositories/propertyImage.repository.js';

export async function uploadMyPropertyImage(request: FastifyRequest, reply: FastifyReply) {
  if (request.authenticatedUser?.userRole !== UserRole.LANDLORD) throw new ForbiddenError();
  const { propertyId } = request.params as { propertyId: string };
  const { altText } = request.query as { altText?: string };
  if (!altText?.trim() || altText.trim().length > PROPERTY_IMAGE_LIMITS.altTextMaximumLength) throw new ValidationError(ERROR_MESSAGES.propertyImageAltTextRequired);
  const file = await request.file();
  if (!file || !(PROPERTY_IMAGE_LIMITS.acceptedContentTypes as readonly string[]).includes(file.mimetype)) throw new ValidationError(ERROR_MESSAGES.propertyImageRejected);
  let imageBytes: Buffer;
  try { imageBytes = await file.toBuffer(); }
  catch { throw new ValidationError(ERROR_MESSAGES.propertyImageRejected); }
  if (imageBytes.length > PROPERTY_IMAGE_LIMITS.maximumFileSizeBytes) throw new ValidationError(ERROR_MESSAGES.propertyImageRejected);
  const image = await addScannedPropertyImage({
    propertyId, landlordId: request.authenticatedUser.id, bytes: imageBytes,
    contentType: file.mimetype, fileName: file.filename, altText: altText.trim(),
  });
  return reply.code(201).send({ image: { id: image.id, altText: image.altText, width: image.width, height: image.height, mediaType: image.mediaType } });
}
