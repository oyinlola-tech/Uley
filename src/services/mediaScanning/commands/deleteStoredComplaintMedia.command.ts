import { applicationEnvironment } from '../../../configs/env.config.js';
import { MEDIA_SERVICE_ENDPOINTS, MEDIA_SERVICE_TIMEOUT_MS } from '../../../constants/mediaService.constant.js';

export async function deleteStoredComplaintMedia(storageKey: string): Promise<void> {
  const { mediaServiceUrl, mediaServiceApiKey } = applicationEnvironment;
  if (!mediaServiceUrl || !mediaServiceApiKey) return;
  await fetch(`${mediaServiceUrl}${MEDIA_SERVICE_ENDPOINTS.deleteImage}`, {
    method: 'POST', headers: { authorization: `Bearer ${mediaServiceApiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ storage_key: storageKey }), signal: AbortSignal.timeout(MEDIA_SERVICE_TIMEOUT_MS),
  });
}
