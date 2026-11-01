'use client';
import { useEffect, useState } from 'react';
import { WEB_AUTH_SESSION_CHANGED_EVENT, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { AccountRole } from '../enums';

function readRoleFromAccessToken(): AccountRole | null {
  try {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    const tokenClaims = token?.split('.')[1];
    if (!tokenClaims) return null;
    const normalizedClaims = tokenClaims.replaceAll('-', '+').replaceAll('_', '/');
    const paddedClaims = normalizedClaims.padEnd(Math.ceil(normalizedClaims.length / 4) * 4, '=');
    const claims = JSON.parse(window.atob(paddedClaims)) as { role?: string };
    return Object.values(AccountRole).find((role) => role === claims.role) ?? null;
  } catch {
    return null;
  }
}

export function useWebSessionRole() {
  const [role, setRole] = useState<AccountRole | null>(null);
  useEffect(() => {
    function refreshRole() { setRole(readRoleFromAccessToken()); }
    refreshRole();
    window.addEventListener(WEB_AUTH_SESSION_CHANGED_EVENT, refreshRole);
    window.addEventListener('storage', refreshRole);
    return () => {
      window.removeEventListener(WEB_AUTH_SESSION_CHANGED_EVENT, refreshRole);
      window.removeEventListener('storage', refreshRole);
    };
  }, []);
  return role;
}
