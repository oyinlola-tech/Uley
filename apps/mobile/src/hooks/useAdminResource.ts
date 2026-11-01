import { useCallback, useEffect, useState } from 'react';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { MOBILE_ERROR_MESSAGES } from '../errors';

export function useAdminResource<TData>(endpoint: string) {
  const { accessToken } = useUleyAuth();
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true); setError('');
    try { setData(await requestUleyApi<TData>(endpoint, undefined, accessToken)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setIsLoading(false); }
  }, [accessToken, endpoint]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, isLoading, reload };
}
