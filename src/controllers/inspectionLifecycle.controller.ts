import type { FastifyReply, FastifyRequest } from 'fastify';
import { InspectionRescheduleStatus, PropertyReviewStatus } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { answerInspectionDateChange, changeLandlordUnitAvailability, createEligiblePropertyReview, getPublicHomeReviews, getReviewModerationQueue, listLandlordOccupancies, listMyOccupancies, recordInspectionFeedback, reportMissedInspection, requestInspectionDateChange, respondToOccupancyRequest, reviewHomeReview } from '../services/index.js';
import { inspectionFeedbackSchema, inspectionRescheduleResponseSchema, inspectionRescheduleSchema, occupancyResponseSchema, propertyReviewSchema } from '../validations/inspectionLifecycle.validation.js';

export async function requestReschedule(request: FastifyRequest, reply: FastifyReply) {
  const body = inspectionRescheduleSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const result = await requestInspectionDateChange({ inspectionId: param(request, 'inspectionId'), studentId: accountId(request), proposedFor: body.data.proposedFor, ...(body.data.message ? { message: body.data.message } : {}) });
  if (!result) throw new ConflictError(ERROR_MESSAGES.inspectionRescheduleUnavailable);
  return reply.code(201).send({ reschedule: result });
}

export async function respondToReschedule(request: FastifyRequest, reply: FastifyReply) {
  const body = inspectionRescheduleResponseSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const result = await answerInspectionDateChange({ requestId: param(request, 'requestId'), landlordId: accountId(request), decision: body.data.decision as InspectionRescheduleStatus, ...(body.data.response ? { response: body.data.response } : {}) });
  if (!result) throw new ConflictError(ERROR_MESSAGES.inspectionRescheduleUnavailable);
  return reply.send({ reschedule: result });
}

export async function markVisitMissed(request: FastifyRequest, reply: FastifyReply) {
  const user = request.authenticatedUser;
  if (!user) throw new ForbiddenError();
  const inspection = await reportMissedInspection({ inspectionId: param(request, 'inspectionId'), actorId: user.id, isLandlord: user.userRole === 'LANDLORD' });
  if (!inspection) throw new ConflictError(ERROR_MESSAGES.inspectionCannotBeMarkedMissed);
  return reply.send({ inspection });
}

export async function submitVisitFeedback(request: FastifyRequest, reply: FastifyReply) {
  const body = inspectionFeedbackSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const result = await recordInspectionFeedback({ inspectionId: param(request, 'inspectionId'), studentId: accountId(request), outcome: body.data.outcome, paymentReported: body.data.paymentReported, ...(body.data.comment ? { comment: body.data.comment } : {}), ...(body.data.moveInDate ? { moveInDate: body.data.moveInDate } : {}) });
  if (!result) throw new ConflictError(ERROR_MESSAGES.inspectionFeedbackUnavailable);
  return reply.code(201).send(result);
}

export async function getStudentOccupancies(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ occupancies: await listMyOccupancies(accountId(request)) });
}

export async function getLandlordOccupancyRequests(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ occupancies: await listLandlordOccupancies(accountId(request)) });
}

export async function answerOccupancyRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = occupancyResponseSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const occupancy = await respondToOccupancyRequest({ occupancyId: param(request, 'occupancyId'), landlordId: accountId(request), decision: body.data.decision, paymentConfirmed: body.data.paymentConfirmed, ...(body.data.paymentAmount !== undefined ? { paymentAmount: body.data.paymentAmount } : {}) });
  if (!occupancy) throw new NotFoundError(ERROR_MESSAGES.occupancyRequestNotFound);
  return reply.send({ occupancy });
}

export async function submitHomeReview(request: FastifyRequest, reply: FastifyReply) {
  const body = propertyReviewSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  return reply.code(201).send({ review: await createEligiblePropertyReview({ occupancyId: param(request, 'occupancyId'), studentId: accountId(request), ...body.data }) });
}

export async function getHomeReviews(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ reviews: await getPublicHomeReviews(param(request, 'propertyId')) });
}

export async function updateUnitAvailability(request: FastifyRequest, reply: FastifyReply) {
  const isAvailable = (request.body as { isAvailable?: unknown } | undefined)?.isAvailable;
  if (typeof isAvailable !== 'boolean') throw new ValidationError();
  return reply.send({ unit: await changeLandlordUnitAvailability({ unitId: param(request, 'unitId'), landlordId: accountId(request), isAvailable }) });
}

export async function getHomeReviewQueue(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ reviews: await getReviewModerationQueue() });
}

export async function decideHomeReview(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { decision?: unknown; reviewNote?: unknown } | undefined;
  if (body?.decision !== PropertyReviewStatus.APPROVED && body?.decision !== PropertyReviewStatus.REJECTED) throw new ValidationError();
  if (body.reviewNote !== undefined && (typeof body.reviewNote !== 'string' || body.reviewNote.length > 500)) throw new ValidationError();
  return reply.send({ review: await reviewHomeReview({ reviewId: param(request, 'reviewId'), reviewerId: accountId(request), decision: body.decision, ...(typeof body.reviewNote === 'string' ? { reviewNote: body.reviewNote } : {}), requestId: request.id }) });
}

function param(request: FastifyRequest, name: string): string {
  const value = (request.params as Record<string, string>)[name];
  if (!value) throw new NotFoundError();
  return value;
}

function accountId(request: FastifyRequest): string {
  if (!request.authenticatedUser) throw new ForbiddenError();
  return request.authenticatedUser.id;
}
