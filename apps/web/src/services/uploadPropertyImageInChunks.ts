import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS } from '../constants';
import { WEB_PROPERTY_IMAGE_UPLOAD } from '../constants/propertyImage.constant';
import { WEB_ERROR_MESSAGES, getApiResponseErrorMessage } from '../errors';

type UploadSession = { uploadId: string; uploadedChunks: number[]; totalChunks: number; chunkSizeBytes?: number; scanStatus?: string | null; completedImage?: UploadedPropertyImage | null };
export type UploadedPropertyImage = { id: string; altText: string; width: number; height: number; mediaType: string };
export class TerminalPropertyImageScanError extends Error {
  constructor(message: string, readonly scanStatus: 'REJECTED' | 'FAILED') { super(message); }
}

export async function uploadPropertyImageInChunks(input: {
  propertyId: string; file: File; altText: string; accessToken: string; onProgress: (message: string) => void;
}): Promise<UploadedPropertyImage> {
  const uploadUrl = `${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.landlordProperties}/${input.propertyId}${WEB_API_ENDPOINTS.landlordPropertyImageUploads}`;
  const sessionStorageKey = `${uploadUrl}:${input.file.name}:${input.file.size}:${input.file.lastModified}`;
  let uploadSession = await findOrStartUploadSession(uploadUrl, sessionStorageKey, input);
  if (uploadSession.completedImage) {
    window.localStorage.removeItem(sessionStorageKey);
    return uploadSession.completedImage;
  }
  if (uploadSession.scanStatus) {
    try { return await waitForPropertyImageScan(uploadUrl, uploadSession, input.accessToken, input.onProgress); }
    catch (error) { if (error instanceof TerminalPropertyImageScanError) window.localStorage.removeItem(sessionStorageKey); throw error; }
  }
  const chunkCount = uploadSession.totalChunks;
  input.onProgress(`Uploading photo chunks: ${uploadSession.uploadedChunks.length} of ${chunkCount}.`);
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    if (uploadSession.uploadedChunks.includes(chunkIndex)) continue;
    await retryChunkUpload(uploadUrl, uploadSession.uploadId, chunkIndex, input.file, input.accessToken, uploadSession.chunkSizeBytes ?? WEB_PROPERTY_IMAGE_UPLOAD.uploadChunkSizeBytes);
    uploadSession = { ...uploadSession, uploadedChunks: [...uploadSession.uploadedChunks, chunkIndex] };
    input.onProgress(`Uploading photo chunks: ${uploadSession.uploadedChunks.length} of ${chunkCount}.`);
  }
  const queuedScan = await requestApi<UploadSession>(`${uploadUrl}/${uploadSession.uploadId}/complete`, input.accessToken, { method: 'POST' });
  let completedImage: UploadedPropertyImage;
  try { completedImage = await waitForPropertyImageScan(uploadUrl, queuedScan, input.accessToken, input.onProgress); }
  catch (error) { if (error instanceof TerminalPropertyImageScanError) window.localStorage.removeItem(sessionStorageKey); throw error; }
  window.localStorage.removeItem(sessionStorageKey);
  return completedImage;
}

async function waitForPropertyImageScan(url: string, initialSession: UploadSession, token: string, onProgress: (message: string) => void): Promise<UploadedPropertyImage> {
  const startedAt = Date.now();
  let session = initialSession;
  while (Date.now() - startedAt < WEB_PROPERTY_IMAGE_UPLOAD.scanMaximumWaitMilliseconds) {
    if (session.scanStatus === 'COMPLETED' && session.completedImage) return session.completedImage;
    if (session.scanStatus === 'REJECTED') throw new TerminalPropertyImageScanError(WEB_ERROR_MESSAGES.propertyImageScanRejected, 'REJECTED');
    if (session.scanStatus === 'FAILED') throw new TerminalPropertyImageScanError(WEB_ERROR_MESSAGES.propertyImageScanUnavailable, 'FAILED');
    onProgress(`Photo safety scan: ${session.scanStatus === 'RETRYING' ? 'retrying' : session.scanStatus === 'PROCESSING' ? 'in progress' : 'queued'}.`);
    await new Promise((resolve) => setTimeout(resolve, WEB_PROPERTY_IMAGE_UPLOAD.scanPollIntervalMilliseconds));
    session = await getUploadSession(url, initialSession.uploadId, token);
  }
  throw new Error(WEB_ERROR_MESSAGES.propertyImageScanUnavailable);
}

async function getUploadSession(url: string, uploadId: string, token: string) {
  return requestApi<UploadSession>(`${url}/${uploadId}`, token);
}

async function findOrStartUploadSession(url: string, storageKey: string, input: { propertyId: string; file: File; altText: string; accessToken: string }) {
  const existingUploadId = window.localStorage.getItem(storageKey);
  if (existingUploadId) {
    try { return await requestApi<UploadSession>(`${url}/${existingUploadId}`, input.accessToken); }
    catch { window.localStorage.removeItem(storageKey); }
  }
  const uploadSession = await requestApi<UploadSession & { expiresAt: string }>(url, input.accessToken, {
    method: 'POST', body: JSON.stringify({ fileName: input.file.name, contentType: input.file.type, fileSize: input.file.size, altText: input.altText }),
    headers: { 'content-type': 'application/json' },
  });
  window.localStorage.setItem(storageKey, uploadSession.uploadId);
  return { ...uploadSession, uploadedChunks: [] };
}

async function retryChunkUpload(url: string, uploadId: string, chunkIndex: number, file: File, accessToken: string, chunkSizeBytes: number) {
  const chunk = file.slice(chunkIndex * chunkSizeBytes, (chunkIndex + 1) * chunkSizeBytes);
  let lastError: unknown;
  for (let attempt = 0; attempt < WEB_PROPERTY_IMAGE_UPLOAD.maximumChunkRetries; attempt += 1) {
    const formData = new FormData();
    formData.append('chunk', chunk, `chunk-${chunkIndex}.part`);
    try {
      await requestApi(`${url}/${uploadId}/chunks/${chunkIndex}`, accessToken, { method: 'PUT', body: formData });
      return;
    } catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1))); }
  }
  throw lastError;
}

async function requestApi<TResponse = unknown>(url: string, accessToken: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(url, { ...options, headers: { authorization: `Bearer ${accessToken}`, ...options.headers } });
  const payload = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | TResponse | null;
  if (!response.ok) { const failure = payload as { error?: { message?: string }; requestId?: string } | null; throw new Error(getApiResponseErrorMessage(failure?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, failure?.requestId)); }
  return payload as TResponse;
}
