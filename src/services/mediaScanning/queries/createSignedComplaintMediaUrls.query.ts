import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';
import { ServiceUnavailableError } from '../../../errors/app.error.js';

type SignedMediaResponse = { media_urls: Record<string, string> };

export async function createSignedComplaintMediaUrls(storageKeys: string[]): Promise<Record<string, string>> {
  if (!storageKeys.length) return {};
  const { mediaServiceUrl, mediaServiceApiKey } = applicationEnvironment;
  if (!mediaServiceUrl || !mediaServiceApiKey) throw new ServiceUnavailableError();
  try {
    const response = await fetch(`${mediaServiceUrl}${MEDIA_SERVICE_ENDPOINTS.complaintMediaSignedUrls}`, {
      method: 'POST', headers: { authorization: `Bearer ${mediaServiceApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ storage_keys: storageKeys }), signal: AbortSignal.timeout(MEDIA_SERVICE_TIMEOUT_MS),
    });
    if (!response.ok) throw new ServiceUnavailableError();
    return (await response.json() as SignedMediaResponse).media_urls;
  } catch { throw new ServiceUnavailableError(); }
}
