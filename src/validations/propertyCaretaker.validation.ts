import { z } from 'zod';

export const propertyCaretakerAssignmentSchema = z.object({ emailAddress: z.string().trim().toLowerCase().email().max(320) }).strict();
export const propertyCaretakerParamsSchema = z.object({ propertyId: z.uuid() }).passthrough();
export const propertyCaretakerRemovalParamsSchema = propertyCaretakerParamsSchema.extend({ caretakerUserId: z.uuid() });
