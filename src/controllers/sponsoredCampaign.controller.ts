import type { FastifyReply, FastifyRequest } from 'fastify';
import { ConflictError, ForbiddenError, ValidationError, UnauthorizedError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { changeOwnSponsoredCampaignStatus, decideSponsoredCampaign, listMySponsoredCampaigns, listSponsoredCampaignsForSchool, recordCampaignPaymentConfirmation, recordSponsoredCampaignEvent, requestSponsoredCampaign } from '../services/sponsoredCampaigns/index.js';
import { confirmSponsoredPaymentSchema, createSponsoredCampaignSchema, pauseSponsoredCampaignSchema, reviewSponsoredCampaignSchema, sponsoredCampaignEventSchema } from '../validations/sponsoredCampaign.validation.js';
import { createSponsoredCampaignCheckoutSchema, verifySponsoredCampaignCheckoutSchema } from '../validations/sponsoredCampaignCheckout.validation.js';
import { startSponsoredCampaignCheckout, verifyOwnSponsoredCampaignCheckout } from '../services/sponsoredCampaigns/index.js';
import { acceptBachsWebhook } from '../services/sponsoredCampaigns/payments/bachsPayment.service.js';

export async function createLandlordCampaign(request: FastifyRequest, reply: FastifyReply) {
  const body = createSponsoredCampaignSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const campaign = await requestSponsoredCampaign({ landlordId: requireUserId(request), propertyId: body.data.propertyId, headline: body.data.headline, description: body.data.description, budgetAmount: body.data.budgetAmount, startsAt: body.data.startsAt, endsAt: body.data.endsAt, ...(body.data.targetCity ? { targetCity: body.data.targetCity } : {}), ...(body.data.targetUniversityId ? { targetUniversityId: body.data.targetUniversityId } : {}) });
  return reply.code(201).send({ campaign });
}

export async function startLandlordCampaignCheckout(request: FastifyRequest, reply: FastifyReply) {
  const body = createSponsoredCampaignCheckoutSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const user = request.authenticatedUser;
  if (!user) throw new ForbiddenError();
  const checkout = await startSponsoredCampaignCheckout({ landlordId: user.id, email: user.emailAddress, campaignIds: body.data.campaignIds });
  return reply.code(201).send({ checkout: { ...checkout, amountKobo: checkout.amountKobo.toString() } });
}

export async function verifyLandlordCampaignCheckout(request: FastifyRequest, reply: FastifyReply) {
  const query = verifySponsoredCampaignCheckoutSchema.safeParse(request.query);
  if (!query.success) throw new ValidationError();
  const result = await verifyOwnSponsoredCampaignCheckout({ landlordId: requireUserId(request), reference: query.data.reference });
  return reply.send({ paid: result.paid, checkout: { ...result.checkout, amountKobo: result.checkout.amountKobo.toString() } });
}

export async function receiveBachsWebhook(request: FastifyRequest, reply: FastifyReply) {
  const signature = getSingleHeader(request.headers['x-bachs-signature']);
  const signatureV2 = getSingleHeader(request.headers['x-bachs-signature-v2']);
  const timestamp = getSingleHeader(request.headers['x-bachs-timestamp']);
  if (signature === null || signatureV2 === null || timestamp === null) throw new UnauthorizedError();
  return reply.send(await acceptBachsWebhook({ ...(Buffer.isBuffer(request.rawBody) ? { rawBody: request.rawBody } : {}), ...(signature ? { signature } : {}), ...(signatureV2 ? { signatureV2 } : {}), ...(timestamp ? { timestamp } : {}) }));
}

function getSingleHeader(value: string | string[] | undefined) { return Array.isArray(value) ? null : value; }

export async function getLandlordCampaigns(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ campaigns: await listMySponsoredCampaigns(requireUserId(request)) });
}

export async function updateLandlordCampaignStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = pauseSponsoredCampaignSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { campaignId } = request.params as { campaignId: string };
  return reply.send({ campaign: await changeOwnSponsoredCampaignStatus({ campaignId, landlordId: requireUserId(request), pause: body.data.pause }) });
}

export async function getAdminCampaigns(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ campaigns: await listSponsoredCampaignsForSchool() });
}

export async function reviewCampaign(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewSponsoredCampaignSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const { campaignId } = request.params as { campaignId: string };
  const campaign = await decideSponsoredCampaign({ campaignId, reviewerId: requireUserId(request), decision: body.data.decision, ...(body.data.decisionNote ? { decisionNote: body.data.decisionNote } : {}), requestId: request.id });
  return reply.send({ campaign });
}

export async function confirmCampaignPayment(request: FastifyRequest, reply: FastifyReply) {
  const body = confirmSponsoredPaymentSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { campaignId } = request.params as { campaignId: string };
  const campaign = await recordCampaignPaymentConfirmation({ campaignId, reviewerId: requireUserId(request), requestId: request.id });
  return reply.send({ campaign });
}

export async function recordCampaignEvent(request: FastifyRequest, reply: FastifyReply) {
  const body = sponsoredCampaignEventSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { campaignId } = request.params as { campaignId: string };
  try { return reply.send(await recordSponsoredCampaignEvent({ campaignId, eventType: body.data.eventType })); }
  catch (error) { if (error instanceof Error && error.message === ERROR_MESSAGES.sponsoredCampaignNotFound) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignNotFound); throw error; }
}

function requireUserId(request: FastifyRequest): string {
  const userId = request.authenticatedUser?.id;
  if (!userId) throw new ForbiddenError();
  return userId;
}
