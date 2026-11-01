import { z } from 'zod';
import { ReviewDecision } from '../enums/reviewDecision.enum.js';
import { RentalPeriod } from '../enums/rentalPeriod.enum.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

const propertyListingQuerySchema = z.object({
  universityId: z.uuid().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  rentalPeriod: z.nativeEnum(RentalPeriod).default(RentalPeriod.YEAR),
  minimumRentAmount: z.coerce.number().min(0).optional(),
  maximumRentAmount: z.coerce.number().min(0).optional(),
  minimumBedrooms: z.coerce.number().int().min(0).max(20).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
}).strict().refine((query) => (query.latitude === undefined) === (query.longitude === undefined), {
  message: ERROR_MESSAGES.locationCoordinatesRequired,
}).refine((query) => query.radiusKm === undefined || query.latitude !== undefined, {
  message: ERROR_MESSAGES.locationCoordinatesRequired,
}).refine(
  (query) => query.minimumRentAmount === undefined
    || query.maximumRentAmount === undefined
    || query.minimumRentAmount <= query.maximumRentAmount,
);

export function parsePropertyListingQuery(queryParameters: unknown) {
  return propertyListingQuerySchema.safeParse(queryParameters);
}

export const createPropertyRequestSchema = z.object({
  clientDraftId: z.uuid().optional(),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  streetAddress: z.string().trim().min(4).max(255),
  neighborhood: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  unitName: z.string().trim().min(2).max(100),
  rentAmount: z.number().positive().max(100000000),
  rentalPeriod: z.nativeEnum(RentalPeriod).default(RentalPeriod.YEAR),
  securityDeposit: z.number().min(0).max(100000000).default(0),
  monthlyServiceCharge: z.number().min(0).max(100000000).default(0),
  inspectionFee: z.number().min(0).max(100000000).default(0),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).strict().refine((property) => (property.latitude === undefined) === (property.longitude === undefined), {
  message: ERROR_MESSAGES.locationCoordinatesRequired,
});

export const reviewDecisionRequestSchema = z.object({
  decision: z.nativeEnum(ReviewDecision),
  rejectionReason: z.string().trim().min(10).max(500).optional(),
}).refine((decision) => decision.decision !== 'REJECTED' || Boolean(decision.rejectionReason), {
  message: ERROR_MESSAGES.reviewReasonRequired,
});

export function parseCreatePropertyRequest(body: unknown) {
  return createPropertyRequestSchema.safeParse(body);
}

export function parseUpdatePropertyRequest(body: unknown) {
  return createPropertyRequestSchema.omit({ clientDraftId: true }).safeParse(body);
}

export function parseReviewDecisionRequest(body: unknown) {
  return reviewDecisionRequestSchema.safeParse(body);
}

export const requestInspectionSchema = z.object({
  unitId: z.string().uuid(),
  scheduledFor: z.coerce.date().refine((date) => date.getTime() > Date.now(), 'Choose a future inspection time.'),
  studentMessage: z.string().trim().max(500).optional(),
}).strict();

export const respondToInspectionSchema = z.object({
  decision: z.enum(['CONFIRMED', 'DECLINED']),
  landlordResponse: z.string().trim().max(500).optional(),
}).strict();

export const inspectionLocationPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).strict();
