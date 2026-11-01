import { readPendingPropertyImages, removePendingPropertyImage, toImagePickerAsset } from '../storage/propertyMediaQueue.storage';
import { TerminalPropertyImageScanError, uploadPropertyImageInChunks } from './uploadPropertyImageInChunks';

export async function syncPendingPropertyImages(input: {
  accountId: string;
  accessToken: string;
  properties: { id: string; status: string }[];
  onProgress: (message: string) => void;
}): Promise<{ pendingImages: Awaited<ReturnType<typeof readPendingPropertyImages>>; completedCount: number; rejectedCount: number }> {
  const pendingImages = await readPendingPropertyImages(input.accountId);
  let completedCount = 0;
  let rejectedCount = 0;
  for (const savedImage of pendingImages) {
    if (!input.properties.some((property) => property.id === savedImage.propertyId && property.status === 'DRAFT')) continue;
    try {
      await uploadPropertyImageInChunks({ propertyId: savedImage.propertyId, photo: toImagePickerAsset(savedImage), altText: savedImage.altText, accessToken: input.accessToken, onProgress: input.onProgress });
    } catch (error) {
      if (!(error instanceof TerminalPropertyImageScanError) || error.scanStatus !== 'REJECTED') throw error;
      await removePendingPropertyImage(input.accountId, savedImage.id);
      rejectedCount += 1;
      continue;
    }
    await removePendingPropertyImage(input.accountId, savedImage.id);
    completedCount += 1;
  }
  return { pendingImages: await readPendingPropertyImages(input.accountId), completedCount, rejectedCount };
}
