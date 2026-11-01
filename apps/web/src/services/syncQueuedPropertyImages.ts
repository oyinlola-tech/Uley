import { deleteQueuedPropertyImage, listQueuedPropertyImages, type QueuedPropertyImage } from '../storage/propertyMediaQueue.storage';
import { TerminalPropertyImageScanError, uploadPropertyImageInChunks } from './uploadPropertyImageInChunks';

export async function syncQueuedPropertyImages(input: {
  accountId: string;
  accessToken: string;
  properties: { id: string; status: string }[];
  onProgress: (message: string) => void;
}): Promise<{ pendingImages: QueuedPropertyImage[]; completedCount: number; rejectedCount: number }> {
  const pendingImages = await listQueuedPropertyImages(input.accountId);
  let completedCount = 0;
  let rejectedCount = 0;
  for (const queuedImage of pendingImages) {
    if (!input.properties.some((property) => property.id === queuedImage.propertyId && property.status === 'DRAFT')) continue;
    const file = new File([queuedImage.file], queuedImage.fileName, { type: queuedImage.contentType, lastModified: queuedImage.lastModified });
    try {
      await uploadPropertyImageInChunks({ propertyId: queuedImage.propertyId, file, altText: queuedImage.altText, accessToken: input.accessToken, onProgress: input.onProgress });
    } catch (error) {
      if (!(error instanceof TerminalPropertyImageScanError) || error.scanStatus !== 'REJECTED') throw error;
      await deleteQueuedPropertyImage(queuedImage.id);
      rejectedCount += 1;
      continue;
    }
    await deleteQueuedPropertyImage(queuedImage.id);
    completedCount += 1;
  }
  return { pendingImages: await listQueuedPropertyImages(input.accountId), completedCount, rejectedCount };
}
