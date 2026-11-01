import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_UPLOAD_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';
import { ServiceUnavailableError, ValidationError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';

type ProviderUploadResponse = { provider_upload_id: string };
type ProviderPart = { part_number: number; etag: string };

export async function startSharedPropertyImageUpload(uploadId: string, contentType: string): Promise<string> {
  const response = await requestMediaService(MEDIA_SERVICE_ENDPOINTS.multipartUploadSessions, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ upload_id: uploadId, media_type: contentType }),
  });
  return (await response.json() as ProviderUploadResponse).provider_upload_id;
}

export async function uploadSharedPropertyImagePart(uploadId: string, providerUploadId: string, partNumber: number, bytes: Buffer) {
  await requestMediaService(`${getSessionUrl(uploadId)}/parts/${partNumber}?provider_upload_id=${encodeURIComponent(providerUploadId)}`, {
    method: 'PUT', headers: { 'content-type': 'application/octet-stream' }, body: new Uint8Array(bytes),
  });
}

export async function getSharedPropertyImageUploadParts(uploadId: string, providerUploadId: string): Promise<ProviderPart[]> {
  const response = await requestMediaService(`${getSessionUrl(uploadId)}/status`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider_upload_id: providerUploadId }),
  });
  return (await response.json() as { parts: ProviderPart[] }).parts;
}

export async function completeSharedPropertyImageUpload(uploadId: string, providerUploadId: string, totalParts: number): Promise<Buffer> {
  const response = await requestMediaService(`${getSessionUrl(uploadId)}/complete`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider_upload_id: providerUploadId, total_parts: totalParts }),
  });
  return Buffer.from(await response.arrayBuffer());
}

export async function discardSharedPropertyImageUpload(uploadId: string, providerUploadId: string): Promise<void> {
  await requestMediaService(getSessionUrl(uploadId), {
    method: 'DELETE', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider_upload_id: providerUploadId }),
  });
}

function getSessionUrl(uploadId: string) {
  return `${MEDIA_SERVICE_ENDPOINTS.multipartUploadSessions}/${uploadId}`;
}

async function requestMediaService(path: string, options: RequestInit): Promise<Response> {
  const { mediaServiceUrl, mediaServiceApiKey } = applicationEnvironment;
  if (!mediaServiceUrl || !mediaServiceApiKey) throw new ServiceUnavailableError(ERROR_MESSAGES.serviceUnavailable);
  try {
    const response = await fetch(`${mediaServiceUrl}${path}`, {
      ...options, headers: { ...options.headers, authorization: `Bearer ${mediaServiceApiKey}` },
      signal: AbortSignal.timeout(MEDIA_SERVICE_UPLOAD_TIMEOUT_MS),
    });
    if (response.status === 422 || response.status === 413) throw new ValidationError(ERROR_MESSAGES.propertyImageChunkRejected);
    if (!response.ok) throw new ServiceUnavailableError(ERROR_MESSAGES.serviceUnavailable);
    return response;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ServiceUnavailableError) throw error;
    throw new ServiceUnavailableError(ERROR_MESSAGES.serviceUnavailable);
  }
}
