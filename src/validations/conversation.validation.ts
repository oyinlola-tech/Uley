import { z } from 'zod';
import { ContentReportReason, ConversationType, RentalPeriod } from '@prisma/client';
import { CONVERSATION_LIMITS } from '../constants/conversation.constant.js';

export const createConversationSchema = z.object({
  type: z.nativeEnum(ConversationType),
  propertyId: z.string().uuid().optional(),
  flatmatePostId: z.string().uuid().optional(),
  userAdvertisementId: z.string().uuid().optional(),
  subject: z.string().trim().min(3).max(120).optional(),
}).strict();

export const sendConversationMessageSchema = z.object({
  body: z.string().trim().min(CONVERSATION_LIMITS.messageMinimumLength).max(CONVERSATION_LIMITS.messageMaximumLength),
}).strict();

export const createFlatmatePostSchema = z.object({
  city: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().max(120).optional(),
  budgetAmount: z.number().positive().max(100_000_000),
  rentalPeriod: z.nativeEnum(RentalPeriod),
  moveInDate: z.coerce.date().optional(),
  description: z.string().trim().min(30).max(CONVERSATION_LIMITS.flatmatePostDescriptionMaximumLength),
}).strict();

export const contentReportSchema = z.object({
  messageId: z.string().uuid().optional(),
  flatmatePostId: z.string().uuid().optional(),
  userAdvertisementId: z.string().uuid().optional(),
  reason: z.nativeEnum(ContentReportReason),
  details: z.string().trim().max(1000).optional(),
}).strict().refine((value) => [value.messageId, value.flatmatePostId, value.userAdvertisementId].filter(Boolean).length === 1);

export const reviewContentReportSchema = z.object({
  status: z.enum(['ACTIONED', 'DISMISSED']),
  reviewNote: z.string().trim().min(10).max(500),
}).strict();

export const reviewFlaggedMessageSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
}).strict();

export const appealRejectedMessageSchema = z.object({ reason: z.string().trim().min(CONVERSATION_LIMITS.messageAppealReasonMinimumLength).max(CONVERSATION_LIMITS.messageAppealReasonMaximumLength) }).strict();
export const reviewMessageAppealSchema = z.object({ decision: z.enum(['OVERTURNED', 'UPHELD']), reviewNote: z.string().trim().min(CONVERSATION_LIMITS.messageAppealReviewNoteMinimumLength).max(CONVERSATION_LIMITS.messageAppealReviewNoteMaximumLength) }).strict();

export const updateFlatmatePostStatusSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED']) }).strict();
