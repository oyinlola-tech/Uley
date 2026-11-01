import { z } from 'zod';
import { COMPLAINT_LIMITS } from '../constants/complaint.constant.js';
import { ComplaintCategory, ComplaintStatus } from '../enums/complaintStatus.enum.js';

export const createComplaintSchema = z.object({
  occupancyId: z.string().uuid(),
  category: z.nativeEnum(ComplaintCategory),
  description: z.string().trim().min(COMPLAINT_LIMITS.descriptionMinimumLength).max(COMPLAINT_LIMITS.descriptionMaximumLength),
  isUrgent: z.boolean().default(false),
}).strict();

export const updateComplaintStatusSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  note: z.string().trim().max(COMPLAINT_LIMITS.resolutionMaximumLength).optional(),
}).strict().refine((value) => value.status !== ComplaintStatus.RESOLVED && value.status !== ComplaintStatus.REJECTED || (value.note?.length ?? 0) >= COMPLAINT_LIMITS.resolutionMinimumLength, { message: 'Provide a clear note before resolving or rejecting a complaint.' });

export const confirmComplaintResolutionSchema = z.object({ resolved: z.boolean() }).strict();
export const complaintMessageSchema = z.object({ body: z.string().trim().min(1).max(COMPLAINT_LIMITS.messageMaximumLength) }).strict();
export const complaintPageSchema = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) }).strict();
