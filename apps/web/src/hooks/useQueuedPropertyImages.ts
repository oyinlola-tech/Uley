'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPropertyMediaAccountId, listQueuedPropertyImages, saveQueuedPropertyImage, type QueuedPropertyImage } from '../storage/propertyMediaQueue.storage';
import { syncQueuedPropertyImages } from '../services/syncQueuedPropertyImages';
import { WEB_AUTH_STORAGE_KEYS } from '../constants/authStorage.constant';
import { WEB_ERROR_MESSAGES } from '../errors';

export function useQueuedPropertyImages(input: {
  properties: { id: string; status: string }[];
  refreshWorkspace: () => Promise<void>;
}) {
  const [pendingImages, setPendingImages] = useState<QueuedPropertyImage[]>([]);
  const [progress, setProgress] = useState('');
  const isSyncing = useRef(false);

  const retryPendingImages = useCallback(async () => {
    const accountId = getPropertyMediaAccountId();
    if (!accountId || !navigator.onLine || isSyncing.current) return;
    isSyncing.current = true;
    try {
      const result = await syncQueuedPropertyImages({ accountId, accessToken: getAccessToken(), properties: input.properties, onProgress: setProgress });
      setPendingImages(result.pendingImages);
      if (result.rejectedCount) setProgress(WEB_ERROR_MESSAGES.propertyImageScanRejected);
      else if (result.completedCount) { setProgress(''); await input.refreshWorkspace(); }
    } catch (error) { setProgress(error instanceof Error ? error.message : 'A photo is saved on this device and will retry when connected.'); }
    finally { isSyncing.current = false; }
  }, [input.properties, input.refreshWorkspace]);

  useEffect(() => {
    const accountId = getPropertyMediaAccountId();
    if (accountId) void listQueuedPropertyImages(accountId).then(setPendingImages).catch(() => setProgress('Saved photos could not be restored on this browser.'));
    const retryWhenOnline = () => { void retryPendingImages(); };
    window.addEventListener('online', retryWhenOnline);
    void retryPendingImages();
    return () => window.removeEventListener('online', retryWhenOnline);
  }, [retryPendingImages]);

  const queueImage = useCallback(async (propertyId: string, file: File, altText: string) => {
    const accountId = getPropertyMediaAccountId();
    if (!accountId) throw new Error('Sign in again before saving property photos.');
    const image: QueuedPropertyImage = { id: crypto.randomUUID(), accountId, propertyId, altText, fileName: file.name, contentType: file.type, lastModified: file.lastModified, file, savedAt: new Date().toISOString() };
    try { await saveQueuedPropertyImage(image); }
    catch { throw new Error(WEB_ERROR_MESSAGES.propertyImageStorageFailed); }
    setPendingImages((current) => [...current, image]);
    await retryPendingImages();
  }, [retryPendingImages]);

  return { pendingImages, progress, queueImage };
}

function getAccessToken(): string {
  return window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken) ?? '';
}
