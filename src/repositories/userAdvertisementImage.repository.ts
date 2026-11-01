import { UserAdvertisementStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { scanAndStoreAdvertisementImage, deleteStoredPropertyImage } from '../services/mediaScanning/index.js';

export async function addScannedAdvertisementImage(input: { advertisementId: string; advertiserId: string; bytes: Buffer; contentType: string; fileName: string }) {
  const ad = await prismaDatabaseClient.userAdvertisement.findFirst({ where: { id: input.advertisementId, advertiserId: input.advertiserId }, select: { id: true, status: true, imageStorageKey: true } });
  if (!ad) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
  if (ad.status !== UserAdvertisementStatus.PENDING_REVIEW || ad.imageStorageKey) throw new ConflictError(ERROR_MESSAGES.userAdvertisementImageUnavailable);
  const scanned = await scanAndStoreAdvertisementImage(input.advertisementId, input.bytes, input.contentType, input.fileName);
  try {
    const saved = await prismaDatabaseClient.userAdvertisement.updateMany({ where: { id: ad.id, advertiserId: input.advertiserId, status: UserAdvertisementStatus.PENDING_REVIEW, imageStorageKey: null }, data: { imageStorageKey: scanned.storageKey, imageSha256: scanned.sha256, imageWidth: scanned.width, imageHeight: scanned.height, imageScannedAt: scanned.scannedAt } });
    if (!saved.count) throw new ConflictError(ERROR_MESSAGES.userAdvertisementImageUnavailable);
    return scanned;
  } catch (error) {
    await deleteStoredPropertyImage(scanned.storageKey).catch(() => undefined);
    throw error;
  }
}
