import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_MAX_SIGNED_URLS_PER_REQUEST, MEDIA_SERVICE_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';
import { ServiceUnavailableError } from '../../../errors/app.error.js';

type SignedUrlResponse = { image_urls: Record<string, string> };

export async function createSignedImageUrls(storageKeys: string[]): Promise<Record<string, string>> {
  if (!storageKeys.length) return {};
  const { mediaServiceUrl, mediaServiceApiKey } = applicationEnvironment;
  if (!mediaServiceUrl || !mediaServiceApiKey) throw new ServiceUnavailableError();
  try {
    const signedImageUrls: Record<string, string> = {};
    for (let startIndex = 0; startIndex < storageKeys.length; startIndex += MEDIA_SERVICE_MAX_SIGNED_URLS_PER_REQUEST) {
      const batch = storageKeys.slice(startIndex, startIndex + MEDIA_SERVICE_MAX_SIGNED_URLS_PER_REQUEST);
      const response = await fetch(`${mediaServiceUrl}${MEDIA_SERVICE_ENDPOINTS.signedImageUrls}`, {
        method: 'POST', headers: { authorization: `Bearer ${mediaServiceApiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ storage_keys: batch }), signal: AbortSignal.timeout(MEDIA_SERVICE_TIMEOUT_MS),
      });
      if (!response.ok) throw new ServiceUnavailableError();
      Object.assign(signedImageUrls, (await response.json() as SignedUrlResponse).image_urls);
    }
    return signedImageUrls;
  } catch { throw new ServiceUnavailableError(); }
}
