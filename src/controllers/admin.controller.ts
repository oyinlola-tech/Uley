import type { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { listPendingVerificationReviews, reviewLandlordVerification, reviewPropertyVerification } from '../services/admin/index.js';
import { parseReviewDecisionRequest } from '../validations/property.validation.js';

export async function getPendingVerificationReviews(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listPendingVerificationReviews());
}

export async function reviewLandlordVerificationFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const { landlordId } = request.params as { landlordId: string };
  const decision = parseReviewDecisionRequest(request.body);
  if (!decision.success) throw new ValidationError(decision.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  return reply.send({ verification: await reviewLandlordVerification(landlordId, { reviewerId: request.authenticatedUser!.id, requestId: request.id, decision: decision.data.decision, ...(decision.data.rejectionReason ? { rejectionReason: decision.data.rejectionReason } : {}) }) });
}

export async function reviewPropertyVerificationFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const { propertyId } = request.params as { propertyId: string };
  const decision = parseReviewDecisionRequest(request.body);
  if (!decision.success) throw new ValidationError(decision.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  return reply.send({ verification: await reviewPropertyVerification(propertyId, { reviewerId: request.authenticatedUser!.id, requestId: request.id, decision: decision.data.decision, ...(decision.data.rejectionReason ? { rejectionReason: decision.data.rejectionReason } : {}) }) });
}
