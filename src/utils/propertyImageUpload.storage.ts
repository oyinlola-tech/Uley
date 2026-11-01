import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { applicationEnvironment } from '../configs/env.config.js';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';
import { NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export type ImageUploadManifest = {
  uploadId: string; propertyId: string; landlordId: string; fileName: string; contentType: string;
  altText: string; fileSize: number; totalChunks: number; chunkSizeBytes?: number; expiresAt: string;
  uploadedChunks: number[]; completedImage?: { id: string; altText: string; width: number; height: number; mediaType: string };
};

export async function createImageUploadSession(input: Omit<ImageUploadManifest, 'uploadId' | 'expiresAt' | 'uploadedChunks'>) {
  const uploadId = randomUUID();
  const manifest: ImageUploadManifest = {
    ...input, uploadId, expiresAt: new Date(Date.now() + PROPERTY_IMAGE_LIMITS.uploadSessionLifetimeMilliseconds).toISOString(), uploadedChunks: [],
  };
  await mkdir(getSessionPath(uploadId), { recursive: true });
  await writeImageUploadManifest(manifest, true);
  return manifest;
}

export async function readImageUploadSession(uploadId: string, landlordId: string, propertyId: string) {
  try {
    const manifest = JSON.parse(await readFile(getManifestPath(uploadId), 'utf8')) as ImageUploadManifest;
    if (manifest.landlordId !== landlordId || manifest.propertyId !== propertyId) throw new NotFoundError();
    if (Date.parse(manifest.expiresAt) < Date.now()) { await rm(getSessionPath(uploadId), { recursive: true, force: true }); throw new ValidationError(ERROR_MESSAGES.propertyImageUploadExpired); }
    return manifest;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    throw new NotFoundError();
  }
}

export async function storeImageUploadChunk(manifest: ImageUploadManifest, chunkIndex: number, chunkBytes: Buffer) {
  if (manifest.completedImage) return manifest;
  const chunkSizeBytes = manifest.chunkSizeBytes ?? PROPERTY_IMAGE_LIMITS.uploadChunkSizeBytes;
  const expectedChunkCount = Math.ceil(manifest.fileSize / chunkSizeBytes);
  const expectedChunkBytes = Math.min(chunkSizeBytes, manifest.fileSize - chunkIndex * chunkSizeBytes);
  if (manifest.totalChunks !== expectedChunkCount || chunkIndex < 0 || chunkIndex >= expectedChunkCount || chunkBytes.length !== expectedChunkBytes) {
    throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
  }
  const chunkPath = join(getSessionPath(manifest.uploadId), `${chunkIndex}.part`);
  const temporaryChunkPath = `${chunkPath}.${randomUUID()}.tmp`;
  await writeFile(temporaryChunkPath, chunkBytes, { flag: 'wx' });
  await rename(temporaryChunkPath, chunkPath);
  if (!manifest.uploadedChunks.includes(chunkIndex)) manifest.uploadedChunks.push(chunkIndex);
  await writeImageUploadManifest(manifest);
  return manifest;
}

export async function assembleImageUpload(manifest: ImageUploadManifest) {
  if (manifest.completedImage) throw new ValidationError(ERROR_MESSAGES.propertyImageUploadAlreadyCompleted);
  if (manifest.uploadedChunks.length !== manifest.totalChunks) throw new ValidationError(ERROR_MESSAGES.propertyImageChunksMissing);
  const chunkBytes = await Promise.all(Array.from({ length: manifest.totalChunks }, (_, index) => readFile(join(getSessionPath(manifest.uploadId), `${index}.part`))));
  const imageBytes = Buffer.concat(chunkBytes);
  if (imageBytes.length !== manifest.fileSize) throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
  return imageBytes;
}

export async function markImageUploadCompleted(manifest: ImageUploadManifest, completedImage: NonNullable<ImageUploadManifest['completedImage']>) {
  manifest.completedImage = completedImage;
  await writeImageUploadManifest(manifest);
  await Promise.all(manifest.uploadedChunks.map((chunkIndex) => rm(join(getSessionPath(manifest.uploadId), `${chunkIndex}.part`), { force: true })));
  manifest.uploadedChunks = [];
  await writeImageUploadManifest(manifest);
  return manifest;
}

export async function discardImageUploadChunks(manifest: ImageUploadManifest): Promise<void> {
  await Promise.all(manifest.uploadedChunks.map((chunkIndex) => rm(join(getSessionPath(manifest.uploadId), `${chunkIndex}.part`), { force: true })));
  manifest.uploadedChunks = [];
  await writeImageUploadManifest(manifest);
}

function getSessionPath(uploadId: string) {
  if (!isValidPropertyImageUploadId(uploadId)) throw new NotFoundError();
  return join(applicationEnvironment.mediaUploadTemporaryDirectory, uploadId);
}
export function isValidPropertyImageUploadId(uploadId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId);
}
function getManifestPath(uploadId: string) { return join(getSessionPath(uploadId), 'manifest.json'); }

async function writeImageUploadManifest(manifest: ImageUploadManifest, createOnly = false) {
  const manifestPath = getManifestPath(manifest.uploadId);
  if (createOnly) { await writeFile(manifestPath, JSON.stringify(manifest), { flag: 'wx' }); return; }
  const temporaryPath = `${manifestPath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(manifest), { flag: 'wx' });
  await rename(temporaryPath, manifestPath);
}
