import type { FastifyReply, FastifyRequest } from 'fastify';
import { USER_ADVERTISEMENT_LIMITS } from '../constants/userAdvertisement.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { ForbiddenError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { addScannedAdvertisementImage } from '../repositories/userAdvertisementImage.repository.js';

export async function uploadMyAdvertisementImage(request: FastifyRequest, reply: FastifyReply) {
  const user = request.authenticatedUser;
  if (!user || ![UserRole.STUDENT, UserRole.BUSINESS_ADVERTISER].includes(user.userRole)) throw new ForbiddenError();
  const file = await request.file();
  if (!file || !(USER_ADVERTISEMENT_LIMITS.imageContentTypes as readonly string[]).includes(file.mimetype)) throw new ValidationError(ERROR_MESSAGES.userAdvertisementImageRejected);
  let bytes: Buffer;
  try { bytes = await file.toBuffer(); } catch { throw new ValidationError(ERROR_MESSAGES.userAdvertisementImageRejected); }
  if (bytes.length > USER_ADVERTISEMENT_LIMITS.imageMaximumFileSizeBytes) throw new ValidationError(ERROR_MESSAGES.userAdvertisementImageRejected);
  const { advertisementId } = request.params as { advertisementId: string };
  const image = await addScannedAdvertisementImage({ advertisementId, advertiserId: user.id, bytes, contentType: file.mimetype, fileName: file.filename });
  return reply.code(201).send({ image: { width: image.width, height: image.height, mediaType: image.mediaType, scannedAt: image.scannedAt } });
}
