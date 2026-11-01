import { Prisma, PropertyStatus, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';
import { scanAndStorePropertyImage, deleteStoredPropertyImage } from '../services/mediaScanning/index.js';

export async function addScannedPropertyImage(input: { propertyId: string; landlordId: string; bytes: Buffer; contentType: string; fileName: string; altText: string; clientUploadId?: string }) {
  const property = await prismaDatabaseClient.property.findFirst({
    where: { id: input.propertyId, landlordId: input.landlordId },
    select: { id: true, status: true, landlord: { select: { landlordVerification: { select: { status: true } } } }, _count: { select: { images: true } } },
  });
  if (!property) throw new NotFoundError();
  if (property.landlord.landlordVerification?.status !== VerificationStatus.APPROVED) throw new ConflictError(ERROR_MESSAGES.landlordVerificationRequired);
  if (property.status !== PropertyStatus.DRAFT) throw new ConflictError(ERROR_MESSAGES.propertyImageUploadRequiresDraft);
  if (input.clientUploadId) {
    const existingImage = await prismaDatabaseClient.propertyImage.findUnique({ where: { clientUploadId: input.clientUploadId } });
    if (existingImage?.propertyId === input.propertyId) return existingImage;
  }
  if (property._count.images >= PROPERTY_IMAGE_LIMITS.maximumImagesPerProperty) throw new ConflictError(ERROR_MESSAGES.propertyImageLimitReached);

  const scannedImage = await scanAndStorePropertyImage(input.propertyId, input.bytes, input.contentType, input.fileName);
  try {
    return await prismaDatabaseClient.$transaction(async (transaction) => {
      const currentProperty = await transaction.property.findFirst({
        where: { id: input.propertyId, landlordId: input.landlordId },
        select: { status: true, landlord: { select: { landlordVerification: { select: { status: true } } } }, _count: { select: { images: true } } },
      });
      if (!currentProperty) throw new NotFoundError();
      if (currentProperty.status !== PropertyStatus.DRAFT || currentProperty.landlord.landlordVerification?.status !== VerificationStatus.APPROVED) {
        throw new ConflictError(ERROR_MESSAGES.propertyImageUploadRequiresDraft);
      }
      if (currentProperty._count.images >= PROPERTY_IMAGE_LIMITS.maximumImagesPerProperty) throw new ConflictError(ERROR_MESSAGES.propertyImageLimitReached);
      return transaction.propertyImage.create({
        data: { propertyId: input.propertyId, ...(input.clientUploadId ? { clientUploadId: input.clientUploadId } : {}), ...scannedImage, altText: input.altText, displayOrder: currentProperty._count.images },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    await deleteStoredPropertyImage(scannedImage.storageKey).catch(() => undefined);
    if (input.clientUploadId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existingImage = await prismaDatabaseClient.propertyImage.findUnique({ where: { clientUploadId: input.clientUploadId } });
      if (existingImage?.propertyId === input.propertyId) return existingImage;
    }
    throw error;
  }
}
