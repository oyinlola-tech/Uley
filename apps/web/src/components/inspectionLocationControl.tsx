'use client';

import { useCallback, useEffect, useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_INSPECTION_LOCATION_COPY, WEB_INSPECTION_LOCATION_POLL_INTERVAL_MS } from '../constants';
import { InspectionStatus } from '../enums';
import { WEB_ERROR_MESSAGES, getApiResponseErrorMessage } from '../errors';
import styles from './inspectionLocationControl.module.css';

type SharedLocation = { latitude: number; longitude: number; updatedAt: string } | null;
type Props = { inspectionId: string; status: InspectionStatus; role: 'STUDENT' | 'LANDLORD' };

export function InspectionLocationControl({ inspectionId, status, role }: Props) {
  const [sharing, setSharing] = useState(false);
  const [sharedLocation, setSharedLocation] = useState<SharedLocation>(null);
  const [error, setError] = useState('');
  const enabled = status === InspectionStatus.CONFIRMED;
  const baseEndpoint = `${WEB_API_ENDPOINTS.inspections}/${inspectionId}`;
  const loadSharedLocation = useCallback(async () => {
    const result = await sendLocationRequest<{ sharing: boolean; location: SharedLocation }>(`${baseEndpoint}${WEB_API_ENDPOINTS.inspectionLocationAction}`, 'GET');
    setSharing(result.sharing);
    setSharedLocation(result.location);
  }, [baseEndpoint]);

  useEffect(() => {
    if (!enabled) return;
    void loadSharedLocation().catch(() => undefined);
    if (role === 'STUDENT') return;
    const poll = setInterval(() => { void loadSharedLocation().catch(() => undefined); }, WEB_INSPECTION_LOCATION_POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [enabled, loadSharedLocation, role]);

  useEffect(() => {
    if (!enabled || role !== 'STUDENT' || !sharing || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(({ coords }) => {
      void sendLocationRequest(`${baseEndpoint}${WEB_API_ENDPOINTS.inspectionLocationAction}`, 'PUT', { latitude: coords.latitude, longitude: coords.longitude })
        .then(() => setSharedLocation({ latitude: coords.latitude, longitude: coords.longitude, updatedAt: new Date().toISOString() }))
        .catch(() => setError(WEB_ERROR_MESSAGES.inspectionLocationUnavailable));
    }, () => setError(WEB_ERROR_MESSAGES.locationPermissionDenied), { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [baseEndpoint, enabled, role, sharing]);

  async function toggleSharing() {
    setError('');
    if (!sharing && !navigator.geolocation) { setError(WEB_ERROR_MESSAGES.locationPermissionDenied); return; }
    try {
      if (sharing) {
        await sendLocationRequest(`${baseEndpoint}${WEB_API_ENDPOINTS.inspectionLocationShareAction}`, 'DELETE');
        setSharing(false); setSharedLocation(null); return;
      }
      await sendLocationRequest(`${baseEndpoint}${WEB_API_ENDPOINTS.inspectionLocationShareAction}`, 'POST', {});
      setSharing(true);
    } catch { setError(WEB_ERROR_MESSAGES.inspectionLocationUnavailable); }
  }

  if (!enabled) return null;
  return <div className={styles.panel}>
    {role === 'STUDENT' ? <><p>{WEB_INSPECTION_LOCATION_COPY.consent}</p><button onClick={() => void toggleSharing()}>{sharing ? WEB_INSPECTION_LOCATION_COPY.stop : WEB_INSPECTION_LOCATION_COPY.share}</button></>
      : <><p>{sharing && sharedLocation ? `Last location update: ${new Date(sharedLocation.updatedAt).toLocaleTimeString()}` : sharing ? WEB_INSPECTION_LOCATION_COPY.stale : WEB_INSPECTION_LOCATION_COPY.waiting}</p>{sharedLocation && <a href={`https://maps.google.com/?q=${sharedLocation.latitude},${sharedLocation.longitude}`} target="_blank" rel="noreferrer">{WEB_INSPECTION_LOCATION_COPY.openMap}</a>}</>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

async function sendLocationRequest<T = undefined>(endpoint: string, method: string, body?: unknown): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | null;
    throw new Error(getApiResponseErrorMessage(failure?.error?.message ?? WEB_ERROR_MESSAGES.inspectionLocationUnavailable, response.status, failure?.requestId));
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
