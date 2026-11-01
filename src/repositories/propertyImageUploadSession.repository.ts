import { prismaDatabaseClient } from '../database/prisma.database.js';

export type PropertyImageUploadSessionInput = {
  uploadId: string;
  propertyId: string;
  landlordId: string;
  providerUploadId: string;
  fileName: string;
  contentType: string;
  altText: string;
  fileSize: number;
  totalChunks: number;
  expiresAt: Date;
};

export function createPropertyImageUploadSession(input: PropertyImageUploadSessionInput) {
  return prismaDatabaseClient.propertyImageUploadSession.create({ data: input });
}

export function findOwnedPropertyImageUploadSession(uploadId: string, propertyId: string, landlordId: string) {
  return prismaDatabaseClient.propertyImageUploadSession.findFirst({ where: { uploadId, propertyId, landlordId } });
}

export function deletePropertyImageUploadSession(uploadId: string) {
  return prismaDatabaseClient.propertyImageUploadSession.deleteMany({ where: { uploadId } });
}
