import { queuePropertyImageScan } from './queuePropertyImageScan.command.js';

export async function completePropertyImageUpload(input: { uploadId: string; propertyId: string; landlordId: string }) {
  return queuePropertyImageScan(input);
}
