import { MOBILE_API_ENDPOINTS, MOBILE_AUTH_STORAGE_KEYS } from '../constants';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { requestUleyApi } from './api';
import type { AuthenticatedAccount, NativeAuthResponse } from './api';

import { AuthClientType } from '../enums';
import { removeCurrentPushDeviceRegistration } from './pushNotificationRegistration';

type AuthContextValue = {
  accessToken: string | null;
  account: AuthenticatedAccount | null;
  isRestoringSession: boolean;
  saveSession: (authResponse: NativeAuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  clearNativeSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getStoredRefreshToken() {
  if (isWebRuntime()) return getWebSessionStorage()?.getItem(MOBILE_AUTH_STORAGE_KEYS.refreshToken) ?? null;
  return SecureStore.getItemAsync(MOBILE_AUTH_STORAGE_KEYS.refreshToken);
}

async function storeRefreshToken(refreshToken: string) {
  if (isWebRuntime()) getWebSessionStorage()?.setItem(MOBILE_AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  else await SecureStore.setItemAsync(MOBILE_AUTH_STORAGE_KEYS.refreshToken, refreshToken);
}

async function deleteStoredRefreshToken() {
  try {
    if (isWebRuntime()) getWebSessionStorage()?.removeItem(MOBILE_AUTH_STORAGE_KEYS.refreshToken);
    else await SecureStore.deleteItemAsync(MOBILE_AUTH_STORAGE_KEYS.refreshToken);
  } catch {
    // A failed cleanup must not leave session restoration as an unhandled rejection.
  }
}

function isWebRuntime() {
  return Platform.OS === 'web';
}

function getWebSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [account, setAccount] = useState<AuthenticatedAccount | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function restoreNativeSession() {
      try {
        const storedRefreshToken = await getStoredRefreshToken();
        if (!storedRefreshToken) return;
        const refreshedSession = await requestUleyApi<NativeAuthResponse>(MOBILE_API_ENDPOINTS.refreshSession, {
          clientType: AuthClientType.NATIVE, refreshToken: storedRefreshToken,
        });
        await storeRefreshToken(refreshedSession.refreshToken);
        if (isMounted) {
          setAccessToken(refreshedSession.accessToken);
          setAccount(refreshedSession.authenticatedUser);
        }
      } catch {
        await deleteStoredRefreshToken();
      } finally {
        if (isMounted) setIsRestoringSession(false);
      }
    }
    void restoreNativeSession();
    return () => { isMounted = false; };
  }, []);

  async function saveSession(authResponse: NativeAuthResponse) {
    await storeRefreshToken(authResponse.refreshToken);
    setAccessToken(authResponse.accessToken);
    setAccount(authResponse.authenticatedUser);
  }

  async function signOut() {
    try {
      if (accessToken) {
        await removeCurrentPushDeviceRegistration(accessToken).catch(() => undefined);
        await requestUleyApi(MOBILE_API_ENDPOINTS.signOut, {}, accessToken);
      }
    } finally {
      await deleteStoredRefreshToken();
      setAccessToken(null);
      setAccount(null);
    }
  }

  async function clearNativeSession() {
    if (accessToken) await removeCurrentPushDeviceRegistration(accessToken).catch(() => undefined);
    await deleteStoredRefreshToken();
    setAccessToken(null);
    setAccount(null);
  }

  const contextValue = useMemo(() => ({ accessToken, account, isRestoringSession, saveSession, signOut, clearNativeSession }), [accessToken, account, isRestoringSession]);
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useUleyAuth(): AuthContextValue {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('useUleyAuth must be used inside AuthProvider.');
  return authContext;
}
