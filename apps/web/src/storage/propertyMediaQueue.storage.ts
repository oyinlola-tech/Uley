import { WEB_AUTH_STORAGE_KEYS } from '../constants/authStorage.constant';

export type QueuedPropertyImage = {
  id: string;
  accountId: string;
  propertyId: string;
  altText: string;
  fileName: string;
  contentType: string;
  lastModified: number;
  file: Blob;
  savedAt: string;
};

const DATABASE_NAME = 'uley-property-media-v1';
const STORE_NAME = 'pending-images';

export function getPropertyMediaAccountId(): string {
  try {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    const encodedPayload = token?.split('.')[1];
    if (!encodedPayload) return '';
    const payload = JSON.parse(window.atob(encodedPayload.replaceAll('-', '+').replaceAll('_', '/'))) as { sub?: string };
    return payload.sub ?? '';
  } catch { return ''; }
}

export async function saveQueuedPropertyImage(image: QueuedPropertyImage): Promise<void> {
  const database = await openDatabase();
  await runTransaction(database, 'readwrite', (store) => store.put(image));
}

export async function listQueuedPropertyImages(accountId: string): Promise<QueuedPropertyImage[]> {
  const database = await openDatabase();
  const images = await runTransaction<QueuedPropertyImage[]>(database, 'readonly', (store) => store.getAll());
  return images.filter((image) => image.accountId === accountId);
}

export async function deleteQueuedPropertyImage(imageId: string): Promise<void> {
  const database = await openDatabase();
  await runTransaction(database, 'readwrite', (store) => store.delete(imageId));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local photo storage is unavailable.'));
  });
}

function runTransaction<T = IDBValidKey>(database: IDBDatabase, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local photo storage failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Local photo storage was interrupted.'));
  });
}
