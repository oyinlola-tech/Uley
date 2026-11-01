import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { File } from 'expo-file-system';
import { MOBILE_PROPERTY_DRAFT_SYNC_INTERVAL_MS } from '../constants/propertyDraft.constant';
import { MOBILE_PROPERTY_IMAGE_UPLOAD } from '../constants/propertyImage.constant';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { readPendingPropertyImages, savePendingPropertyImage, type PendingPropertyImage } from '../storage/propertyMediaQueue.storage';
import { syncPendingPropertyImages } from '../services/syncPendingPropertyImages';

export function usePendingPropertyImages(input: {
  accountId?: string;
  accessToken?: string | null;
  approved: boolean;
  properties: { id: string; status: string }[];
  refreshWorkspace: () => Promise<void>;
}) {
  const [pendingImages, setPendingImages] = useState<PendingPropertyImage[]>([]);
  const [progress, setProgress] = useState('');
  const isSyncing = useRef(false);

  const retryPendingImages = useCallback(async () => {
    if (!input.accountId || !input.accessToken || !input.approved || isSyncing.current || !input.properties.length) return;
    isSyncing.current = true;
    try {
      const result = await syncPendingPropertyImages({ accountId: input.accountId, accessToken: input.accessToken, properties: input.properties, onProgress: setProgress });
      setPendingImages(result.pendingImages);
      if (result.rejectedCount) setProgress(MOBILE_ERROR_MESSAGES.propertyImageScanRejected);
      else if (result.completedCount) { setProgress(''); await input.refreshWorkspace(); }
    } catch (error) { setProgress(error instanceof Error ? error.message : 'A photo is saved on this device and will retry when connected.'); }
    finally { isSyncing.current = false; }
  }, [input.accountId, input.accessToken, input.approved, input.properties, input.refreshWorkspace]);

  useEffect(() => {
    if (input.accountId) void readPendingPropertyImages(input.accountId).then(setPendingImages).catch(() => setProgress('Saved photos could not be restored from this device.'));
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void retryPendingImages(); });
    const retryTimer = setInterval(() => void retryPendingImages(), MOBILE_PROPERTY_DRAFT_SYNC_INTERVAL_MS);
    void retryPendingImages();
    return () => { subscription.remove(); clearInterval(retryTimer); };
  }, [input.accountId, retryPendingImages]);

  const queueImage = useCallback(async (propertyId: string, photo: ImagePickerAsset, altText: string) => {
    if (!input.accountId) throw new Error(MOBILE_ERROR_MESSAGES.propertyImageSignInRequired);
    const fileSize = photo.fileSize || new File(photo.uri).size;
    if (fileSize > MOBILE_PROPERTY_IMAGE_UPLOAD.maximumFileSizeBytes) throw new Error(MOBILE_ERROR_MESSAGES.propertyImageTooLarge);
    let savedImage: PendingPropertyImage;
    try {
      savedImage = await savePendingPropertyImage({
        accountId: input.accountId, propertyId, sourceUri: photo.uri, fileName: photo.fileName ?? 'property-photo.jpg',
        mimeType: photo.mimeType ?? 'image/jpeg', fileSize, width: photo.width, height: photo.height, altText,
      });
    } catch { throw new Error(MOBILE_ERROR_MESSAGES.propertyImageStorageFailed); }
    setPendingImages((current) => [...current, savedImage]);
    await retryPendingImages();
  }, [input.accountId, retryPendingImages]);

  return { pendingImages, progress, queueImage };
}
