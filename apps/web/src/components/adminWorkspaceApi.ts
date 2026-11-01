import { WEB_API_BASE_PATH, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { WEB_ERROR_MESSAGES, getApiResponseErrorMessage } from '../errors';

export async function requestAdminWorkspaceApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const accessToken = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!accessToken) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | T | null;
  if (!response.ok) {
    const failure = payload as { error?: { message?: string }; requestId?: string } | null;
    const message = failure?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry;
    throw new Error(getApiResponseErrorMessage(message, response.status, failure?.requestId));
  }
  return payload as T;
}
