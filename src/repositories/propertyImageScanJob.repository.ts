import { Prisma, PropertyImageScanStatus, PropertyStatus, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';

export async function createPropertyImageScanJob(input: {
  uploadId: string; propertyId: string; landlordId: string; fileName: string; contentType: string; altText: string; sourceBytes: Buffer;
}) {
  const existingJob = await prismaDatabaseClient.propertyImageScanJob.findUnique({ where: { uploadId: input.uploadId } });
  if (existingJob) return existingJob;
  try {
    return await prismaDatabaseClient.$transaction(async (transaction) => {
      const property = await transaction.property.findFirst({
        where: { id: input.propertyId, landlordId: input.landlordId },
        select: { id: true, status: true, landlord: { select: { landlordVerification: { select: { status: true } } } }, _count: { select: { images: true } } },
      });
      if (!property) throw new NotFoundError();
      if (property.status !== PropertyStatus.DRAFT || property.landlord.landlordVerification?.status !== VerificationStatus.APPROVED) {
        throw new ConflictError(ERROR_MESSAGES.propertyImageUploadRequiresDraft);
      }
      const activeJobCount = await transaction.propertyImageScanJob.count({
        where: { propertyId: property.id, status: { in: [PropertyImageScanStatus.QUEUED, PropertyImageScanStatus.PROCESSING, PropertyImageScanStatus.RETRYING] } },
      });
      if (property._count.images + activeJobCount >= PROPERTY_IMAGE_LIMITS.maximumImagesPerProperty) throw new ConflictError(ERROR_MESSAGES.propertyImageLimitReached);
      return transaction.propertyImageScanJob.create({ data: { ...input, sourceBytes: new Uint8Array(input.sourceBytes) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const concurrentlyCreatedJob = await prismaDatabaseClient.propertyImageScanJob.findUnique({ where: { uploadId: input.uploadId } });
      if (concurrentlyCreatedJob) return concurrentlyCreatedJob;
    }
    throw error;
  }
}

export async function getOwnedPropertyImageScanJob(uploadId: string, propertyId: string, landlordId: string) {
  return prismaDatabaseClient.propertyImageScanJob.findFirst({ where: { uploadId, propertyId, landlordId }, include: { propertyImage: true } });
}
