import { File, Paths } from 'expo-file-system';
import { MOBILE_API_BASE_URL, MOBILE_API_ENDPOINTS } from '../constants';
import { MOBILE_PROPERTY_IMAGE_UPLOAD } from '../constants/propertyImage.constant';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import type { ImagePickerAsset } from 'expo-image-picker';

type UploadSession = { uploadId: string; uploadedChunks: number[]; totalChunks: number; chunkSizeBytes?: number; scanStatus?: string | null; completedImage?: UploadedPropertyImage | null };
export type UploadedPropertyImage = { id: string; altText: string; width: number; height: number; mediaType: string };
export class TerminalPropertyImageScanError extends Error {
  constructor(message: string, readonly scanStatus: 'REJECTED' | 'FAILED') { super(message); }
}

export async function uploadPropertyImageInChunks(input: {
  propertyId: string; photo: ImagePickerAsset; altText: string; accessToken: string; onProgress: (message: string) => void;
}): Promise<UploadedPropertyImage> {
  const baseUrl = `${MOBILE_API_BASE_URL}${MOBILE_API_ENDPOINTS.landlordProperties}/${input.propertyId}${MOBILE_API_ENDPOINTS.landlordPropertyImageUploads}`;
  const sourceBlob = await (await fetch(input.photo.uri)).blob();
  const sessionFile = getUploadSessionFile(input.propertyId, input.photo);
  const existingUploadId = sessionFile.exists ? await sessionFile.text().catch(() => '') : '';
  let uploadSession = existingUploadId ? await getUploadSession(baseUrl, existingUploadId, input.accessToken).catch(() => null) : null;
  if (!uploadSession) {
    if (sessionFile.exists) sessionFile.delete();
    uploadSession = await requestApi<UploadSession>(baseUrl, input.accessToken, {
      method: 'POST', body: JSON.stringify({ fileName: input.photo.fileName ?? 'property-photo.jpg', contentType: input.photo.mimeType ?? 'image/jpeg', fileSize: input.photo.fileSize ?? sourceBlob.size, altText: input.altText }),
      headers: { 'content-type': 'application/json' },
    });
    await sessionFile.write(uploadSession.uploadId);
    uploadSession.uploadedChunks = [];
  }
  if (uploadSession.completedImage) { sessionFile.delete(); return uploadSession.completedImage; }
  if (uploadSession.scanStatus) {
    try {
      const image = await waitForPropertyImageScan(baseUrl, uploadSession, input.accessToken, input.onProgress);
      sessionFile.delete();
      return image;
    } catch (error) { if (error instanceof TerminalPropertyImageScanError) sessionFile.delete(); throw error; }
  }
  input.onProgress(`Uploading photo chunks: ${uploadSession.uploadedChunks.length} of ${uploadSession.totalChunks}.`);
  for (let chunkIndex = 0; chunkIndex < uploadSession.totalChunks; chunkIndex += 1) {
    if (uploadSession.uploadedChunks.includes(chunkIndex)) continue;
    const chunkSizeBytes = uploadSession.chunkSizeBytes ?? MOBILE_PROPERTY_IMAGE_UPLOAD.chunkSizeBytes;
    const start = chunkIndex * chunkSizeBytes;
    const chunk = sourceBlob.slice(start, start + chunkSizeBytes);
    await retryChunkUpload(baseUrl, uploadSession.uploadId, chunkIndex, chunk, input.accessToken);
    uploadSession.uploadedChunks.push(chunkIndex);
    input.onProgress(`Uploading photo chunks: ${uploadSession.uploadedChunks.length} of ${uploadSession.totalChunks}.`);
  }
  const queuedScan = await requestApi<UploadSession>(`${baseUrl}/${uploadSession.uploadId}/complete`, input.accessToken, { method: 'POST' });
  let image: UploadedPropertyImage;
  try { image = await waitForPropertyImageScan(baseUrl, queuedScan, input.accessToken, input.onProgress); }
  catch (error) { if (error instanceof TerminalPropertyImageScanError) sessionFile.delete(); throw error; }
  sessionFile.delete();
  return image;
}

async function waitForPropertyImageScan(url: string, initialSession: UploadSession, token: string, onProgress: (message: string) => void): Promise<UploadedPropertyImage> {
  const startedAt = Date.now();
  let session = initialSession;
  while (Date.now() - startedAt < MOBILE_PROPERTY_IMAGE_UPLOAD.scanMaximumWaitMilliseconds) {
    if (session.scanStatus === 'COMPLETED' && session.completedImage) return session.completedImage;
    if (session.scanStatus === 'REJECTED') throw new TerminalPropertyImageScanError(MOBILE_ERROR_MESSAGES.propertyImageScanRejected, 'REJECTED');
    if (session.scanStatus === 'FAILED') throw new TerminalPropertyImageScanError(MOBILE_ERROR_MESSAGES.propertyImageScanUnavailable, 'FAILED');
    onProgress(`Photo safety scan: ${session.scanStatus === 'RETRYING' ? 'retrying' : session.scanStatus === 'PROCESSING' ? 'in progress' : 'queued'}.`);
    await new Promise((resolve) => setTimeout(resolve, MOBILE_PROPERTY_IMAGE_UPLOAD.scanPollIntervalMilliseconds));
    session = await getUploadSession(url, initialSession.uploadId, token);
  }
  throw new Error(MOBILE_ERROR_MESSAGES.propertyImageScanUnavailable);
}

async function getUploadSession(url: string, uploadId: string, token: string) {
  return requestApi<UploadSession>(`${url}/${uploadId}`, token);
}

async function retryChunkUpload(url: string, uploadId: string, chunkIndex: number, chunk: Blob, token: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < MOBILE_PROPERTY_IMAGE_UPLOAD.maximumChunkRetries; attempt += 1) {
    const formData = new FormData();
    formData.append('chunk', chunk, `chunk-${chunkIndex}.part`);
    try { await requestApi(`${url}/${uploadId}/chunks/${chunkIndex}`, token, { method: 'PUT', body: formData }); return; }
    catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1))); }
  }
  throw lastError;
}

async function requestApi<TResponse = unknown>(url: string, token: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(url, { ...options, headers: { authorization: `Bearer ${token}`, ...options.headers } });
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | TResponse | null;
  if (!response.ok) throw new Error((payload as { error?: { message?: string } } | null)?.error?.message ?? 'The photo upload could not continue.');
  return payload as TResponse;
}

function getUploadSessionFile(propertyId: string, photo: ImagePickerAsset) {
  const safePhotoName = (photo.fileName ?? 'property-photo').replaceAll(/[^a-zA-Z0-9.-]/g, '').slice(0, 48);
  return new File(Paths.document, `uley-upload-${propertyId}-${photo.fileSize ?? 0}-${safePhotoName}.json`);
}
