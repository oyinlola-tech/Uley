import { z } from 'zod';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';

export const propertyImageUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(PROPERTY_IMAGE_LIMITS.acceptedContentTypes),
  fileSize: z.number().int().positive().max(PROPERTY_IMAGE_LIMITS.maximumFileSizeBytes),
  altText: z.string().trim().min(1).max(PROPERTY_IMAGE_LIMITS.altTextMaximumLength),
}).strict();

export function parsePropertyImageUploadRequest(requestBody: unknown) {
  return propertyImageUploadRequestSchema.safeParse(requestBody);
}
