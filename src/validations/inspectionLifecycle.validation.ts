import { InspectionFeedbackOutcome } from '@prisma/client';
import { z } from 'zod';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export const inspectionRescheduleSchema = z.object({
  proposedFor: z.coerce.date().refine((date) => date.getTime() > Date.now(), ERROR_MESSAGES.inspectionTimeMustBeFuture),
  message: z.string().trim().max(500).optional(),
}).strict();

export const inspectionFeedbackSchema = z.object({
  outcome: z.nativeEnum(InspectionFeedbackOutcome),
  comment: z.string().trim().max(1000).optional(),
  moveInDate: z.coerce.date().optional(),
  paymentReported: z.boolean().default(false),
}).strict().refine((input) => input.outcome !== InspectionFeedbackOutcome.SECURED || input.moveInDate !== undefined, {
  message: ERROR_MESSAGES.inspectionMoveInDateRequired,
});

export const inspectionRescheduleResponseSchema = z.object({
  decision: z.enum(['ACCEPTED', 'DECLINED']),
  response: z.string().trim().max(500).optional(),
}).strict();

export const occupancyResponseSchema = z.object({
  decision: z.enum(['CONFIRMED', 'DECLINED']),
  paymentConfirmed: z.boolean().default(false),
  paymentAmount: z.number().positive().max(100000000).optional(),
}).strict().refine((input) => !input.paymentConfirmed || input.paymentAmount !== undefined, {
  message: ERROR_MESSAGES.paymentAmountRequired,
});

export const propertyReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(25).max(1500),
}).strict();
