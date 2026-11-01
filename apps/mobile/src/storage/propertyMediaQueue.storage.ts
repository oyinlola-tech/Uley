import { File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

export type PendingPropertyImage = {
  id: string;
  accountId: string;
  propertyId: string;
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  altText: string;
  savedAt: string;
};

export async function savePendingPropertyImage(input: Omit<PendingPropertyImage, 'id' | 'uri' | 'savedAt'> & { sourceUri: string }): Promise<PendingPropertyImage> {
  const pending: PendingPropertyImage = { ...input, id: createId(), uri: '', savedAt: new Date().toISOString() };
  const fileName = `${pending.id}.${getFileExtension(pending.fileName)}`;
  const storedFile = getImageFile(input.accountId, fileName);
  await new File(input.sourceUri).copy(storedFile);
  pending.uri = storedFile.uri;
  const queue = await readQueue(input.accountId);
  await writeQueue(input.accountId, [...queue, pending]);
  return pending;
}

export async function readPendingPropertyImages(accountId: string): Promise<PendingPropertyImage[]> {
  const queue = await readQueue(accountId);
  const validImages: PendingPropertyImage[] = [];
  for (const image of queue) {
    if (new File(image.uri).exists) validImages.push(image);
  }
  if (validImages.length !== queue.length) await writeQueue(accountId, validImages);
  return validImages;
}

export async function removePendingPropertyImage(accountId: string, imageId: string): Promise<void> {
  const queue = await readQueue(accountId);
  const image = queue.find((item) => item.id === imageId);
  if (!image) return;
  const storedFile = new File(image.uri);
  if (storedFile.exists) storedFile.delete();
  await writeQueue(accountId, queue.filter((item) => item.id !== imageId));
}

export function toImagePickerAsset(image: PendingPropertyImage): ImagePickerAsset {
  return { uri: image.uri, fileName: `${image.id}-${image.fileName}`, mimeType: image.mimeType, fileSize: image.fileSize, width: image.width, height: image.height, type: 'image' };
}

async function readQueue(accountId: string): Promise<PendingPropertyImage[]> {
  const queueFile = getQueueFile(accountId);
  if (!queueFile.exists) return [];
  try { return JSON.parse(await queueFile.text()) as PendingPropertyImage[]; } catch { return []; }
}

async function writeQueue(accountId: string, queue: PendingPropertyImage[]): Promise<void> {
  const queueFile = getQueueFile(accountId);
  await queueFile.write(JSON.stringify(queue));
}

function getQueueFile(accountId: string): File {
  return new File(Paths.document, `uley-property-images-${sanitize(accountId)}.json`);
}

function getImageFile(accountId: string, fileName: string): File {
  return new File(Paths.document, `uley-property-image-${sanitize(accountId)}-${fileName}`);
}

function sanitize(value: string): string { return value.replaceAll(/[^a-zA-Z0-9-]/g, ''); }
function getFileExtension(fileName: string): string { return fileName.split('.').pop()?.replaceAll(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'image'; }
function createId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
