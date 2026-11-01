import { MOBILE_API_BASE_URL, MOBILE_AUTHORIZATION_SCHEME } from '../constants';
import { AccountRole } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';

export const ULEY_API_BASE_URL = MOBILE_API_BASE_URL;

export type AuthenticatedAccount = {
  id: string;
  emailAddress: string;
  fullName: string;
  userRole: AccountRole;
  universityId?: string | null;
};

export type NativeAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  authenticatedUser: AuthenticatedAccount;
};

export async function requestUleyApi<TResponse>(
  endpoint: string,
  requestBody?: unknown,
  accessToken?: string,
  requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE',
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${ULEY_API_BASE_URL}${endpoint}`, {
      method: requestMethod ?? (requestBody === undefined ? 'GET' : 'POST'),
      headers: {
        ...(requestBody === undefined ? {} : { 'content-type': 'application/json' }),
        ...(accessToken ? { authorization: `${MOBILE_AUTHORIZATION_SCHEME} ${accessToken}` } : {}),
      },
      body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(MOBILE_ERROR_MESSAGES.accountServiceUnavailable);
  }

  const responseBody = await response.json().catch(() => null) as {
    error?: { message?: string };
    requestId?: string;
  } | null;
  if (!response.ok) {
    const message = responseBody?.error?.message ?? MOBILE_ERROR_MESSAGES.requestFailed;
    throw new Error(response.status >= 500 && responseBody?.requestId ? `${message} · Ref ${responseBody.requestId}` : message);
  }
  return responseBody as TResponse;
}
