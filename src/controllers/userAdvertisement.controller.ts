import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserAdvertisementCategory, UserAdvertisementStatus, UserRole } from '@prisma/client';
import { ForbiddenError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { contactUserAdvertisementOwner as contactUserAdvertisementOwnerService, createUserAdvertisement as createUserAdvertisementService, getOwnUserAdvertisementAnalytics, listOwnUserAdvertisements, listPendingUserAdvertisements, listUserAdvertisements, recordUserAdvertisementEvent, reviewUserAdvertisement as reviewUserAdvertisementService, startUserAdvertisementCheckout, updateUserAdvertisementStatus, verifyUserAdvertisementCheckout } from '../services/userAdvertisements/index.js';
import { createUserAdvertisementCheckoutSchema, createUserAdvertisementSchema, reviewUserAdvertisementSchema, userAdvertisementEventSchema, updateUserAdvertisementStatusSchema, verifyUserAdvertisementCheckoutSchema } from '../validations/userAdvertisement.validation.js';

export async function createUserAdvertisement(request: FastifyRequest, reply: FastifyReply) {
  const body = createUserAdvertisementSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const user = requireAdvertiser(request);
  if (user.userRole === UserRole.STUDENT && body.data.category === UserAdvertisementCategory.LOCAL_SERVICE) throw new ValidationError(ERROR_MESSAGES.studentAdCategoryRequired);
  if (user.userRole === UserRole.BUSINESS_ADVERTISER && body.data.category !== UserAdvertisementCategory.LOCAL_SERVICE) throw new ValidationError(ERROR_MESSAGES.businessAdCategoryRequired);
  const { ctaUrl, ...adDetails } = body.data;
  const ad = await createUserAdvertisementService({ advertiserId: user.id, ...(user.universityId ? { universityId: user.universityId } : {}), ...adDetails, ...(ctaUrl ? { ctaUrl } : {}) });
  return reply.code(201).send({ advertisement: ad });
}

export async function browseUserAdvertisements(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { category?: UserAdvertisementCategory; city?: string; universityId?: string; page?: string };
  const page = Number(query.page ?? '1');
  if (!Number.isInteger(page) || page < 1 || page > 1000) throw new ValidationError();
  const user = request.authenticatedUser;
  if (!user) throw new ForbiddenError();
  return reply.send(await listUserAdvertisements({ userId: user.id, userRole: user.userRole, page, ...(query.category ? { category: query.category } : {}), ...(query.city ? { city: query.city } : {}), ...((query.universityId ?? user.universityId) ? { universityId: query.universityId ?? user.universityId! } : {}) }));
}

export async function getOwnUserAdvertisements(request: FastifyRequest, reply: FastifyReply) { return reply.send({ advertisements: await listOwnUserAdvertisements(requireAdvertiser(request).id) }); }
export async function getOwnUserAdvertisementAnalyticsFromRequest(request: FastifyRequest, reply: FastifyReply) { return reply.send({ analytics: await getOwnUserAdvertisementAnalytics(requireAdvertiser(request).id) }); }

export async function startUserAdvertisementCheckoutFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = createUserAdvertisementCheckoutSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const user = requireAdvertiser(request);
  const checkout = await startUserAdvertisementCheckout({ advertiserId: user.id, email: user.emailAddress, advertisementIds: body.data.advertisementIds });
  return reply.code(201).send({ checkout: { ...checkout, amountKobo: checkout.amountKobo.toString() } });
}

export async function verifyUserAdvertisementCheckoutFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const query = verifyUserAdvertisementCheckoutSchema.safeParse(request.query);
  if (!query.success) throw new ValidationError();
  const result = await verifyUserAdvertisementCheckout({ advertiserId: requireAdvertiser(request).id, reference: query.data.reference });
  return reply.send({ paid: result.paid, checkout: result.checkout ? { ...result.checkout, amountKobo: result.checkout.amountKobo.toString() } : null });
}

export async function changeOwnUserAdvertisementStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = updateUserAdvertisementStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { advertisementId } = request.params as { advertisementId: string };
  return reply.send({ advertisement: await updateUserAdvertisementStatus({ advertisementId, advertiserId: requireAdvertiser(request).id, status: body.data.status }) });
}

export async function contactUserAdvertisementOwner(request: FastifyRequest, reply: FastifyReply) {
  const { advertisementId } = request.params as { advertisementId: string };
  const user = request.authenticatedUser;
  if (!user) throw new ForbiddenError();
  const conversation = await contactUserAdvertisementOwnerService({ advertisementId, userId: user.id, userRole: user.userRole });
  return reply.code(201).send({ conversation });
}

export async function recordUserAdvertisementInteraction(request: FastifyRequest, reply: FastifyReply) {
  const body = userAdvertisementEventSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { advertisementId } = request.params as { advertisementId: string };
  const viewerId = request.authenticatedUser?.id;
  if (!viewerId) throw new ForbiddenError();
  return reply.send(await recordUserAdvertisementEvent({ advertisementId, viewerId, eventType: body.data.eventType }));
}

export async function listUserAdvertisementsForReview(_request: FastifyRequest, reply: FastifyReply) { return reply.send({ advertisements: await listPendingUserAdvertisements() }); }

export async function reviewUserAdvertisementFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewUserAdvertisementSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  if (body.data.decision === 'REJECT' && (body.data.decisionNote?.length ?? 0) < 10) throw new ValidationError(ERROR_MESSAGES.reviewReasonRequired);
  const { advertisementId } = request.params as { advertisementId: string };
  const reviewerId = request.authenticatedUser?.id;
  if (!reviewerId) throw new ForbiddenError();
  return reply.send({ advertisement: await reviewUserAdvertisementService({ advertisementId, reviewerId, decision: body.data.decision, ...(body.data.decisionNote ? { decisionNote: body.data.decisionNote } : {}), requestId: request.id }) });
}

function requireAdvertiser(request: FastifyRequest) {
  const user = request.authenticatedUser;
  if (!user || !([UserRole.STUDENT, UserRole.BUSINESS_ADVERTISER] as UserRole[]).includes(user.userRole)) throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired('student or business advertiser'));
  return user;
}
