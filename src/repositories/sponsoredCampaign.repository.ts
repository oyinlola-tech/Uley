import { NotificationType, PropertyStatus, SponsoredCampaignStatus, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { SPONSORED_CAMPAIGN_LIMITS } from '../constants/sponsoredCampaign.constant.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

const campaignInclude = { property: { select: { id: true, name: true, city: true, status: true } }, targetUniversity: { select: { id: true, name: true } } };

export async function createLandlordSponsoredCampaign(input: { landlordId: string; propertyId: string; targetUniversityId?: string; targetCity?: string; headline: string; description: string; budgetAmount: number; startsAt: Date; endsAt: Date }) {
  const property = await prismaDatabaseClient.property.findFirst({ where: { id: input.propertyId, landlordId: input.landlordId, status: PropertyStatus.PUBLISHED, verification: { is: { status: VerificationStatus.APPROVED } }, landlord: { isActive: true, landlordVerification: { is: { status: VerificationStatus.APPROVED } } } }, select: { id: true } });
  if (!property) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignRequiresVerifiedProperty);
  if (input.startsAt.getTime() < Date.now() || input.endsAt.getTime() - input.startsAt.getTime() < SPONSORED_CAMPAIGN_LIMITS.minimumDurationMilliseconds) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignDateInvalid);
  return prismaDatabaseClient.sponsoredCampaign.create({ data: { ...input, status: SponsoredCampaignStatus.PENDING_REVIEW }, include: campaignInclude });
}

export function findLandlordSponsoredCampaigns(landlordId: string) {
  return prismaDatabaseClient.sponsoredCampaign.findMany({ where: { landlordId }, take: SPONSORED_CAMPAIGN_LIMITS.landlordCampaignPageSize, orderBy: { createdAt: 'desc' }, include: { ...campaignInclude, checkoutReservation: { select: { reference: true, authorizationUrl: true, expiresAt: true, status: true } }, reviewedBy: { select: { fullName: true } }, paymentRecordedBy: { select: { fullName: true } } } });
}

export function findAdminSponsoredCampaigns() {
  return prismaDatabaseClient.sponsoredCampaign.findMany({ take: 100, orderBy: [{ status: 'asc' }, { createdAt: 'asc' }], include: { ...campaignInclude, landlord: { select: { id: true, fullName: true, email: true } }, reviewedBy: { select: { fullName: true } }, paymentRecordedBy: { select: { fullName: true } } } });
}

export async function reviewSponsoredCampaign(input: { campaignId: string; reviewerId: string; decision: 'APPROVE' | 'REJECT'; decisionNote?: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const status = input.decision === 'APPROVE' ? SponsoredCampaignStatus.APPROVED : SponsoredCampaignStatus.REJECTED;
    const changed = await transaction.sponsoredCampaign.updateMany({ where: { id: input.campaignId, status: SponsoredCampaignStatus.PENDING_REVIEW }, data: { status, reviewedById: input.reviewerId, reviewedAt: new Date(), ...(input.decisionNote ? { decisionNote: input.decisionNote } : {}) } });
    if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.sponsoredCampaignNotFound);
    const campaign = await transaction.sponsoredCampaign.findUniqueOrThrow({ where: { id: input.campaignId } });
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'SPONSORED_CAMPAIGN', targetId: campaign.id, summary: 'A sponsored listing received an admin review.', metadata: { decision: input.decision, ...(input.decisionNote ? { note: input.decisionNote } : {}) } } });
    await transaction.notification.createMany({ data: [{ recipientId: campaign.landlordId, type: NotificationType.SPONSORED_CAMPAIGN_UPDATE, title: input.decision === 'APPROVE' ? 'Your campaign was approved' : 'Your campaign needs changes', message: input.decisionNote ?? 'A school moderator reviewed your sponsored listing request.', href: '/landlord/ads', deduplicationKey: 'campaign:' + campaign.id + ':reviewed', scheduledFor: new Date() }], skipDuplicates: true });
    return transaction.sponsoredCampaign.findUniqueOrThrow({ where: { id: campaign.id }, include: campaignInclude });
  });
}

export async function recordSponsoredCampaignPayment(input: { campaignId: string; reviewerId: string; requestId: string }) {
  const campaign = await prismaDatabaseClient.sponsoredCampaign.findFirst({ where: { id: input.campaignId, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, select: { landlordId: true } });
  if (!campaign) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignPaymentUnavailable);
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.sponsoredCampaign.updateMany({ where: { id: input.campaignId, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, data: { paymentConfirmedAt: new Date(), paymentRecordedById: input.reviewerId } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignPaymentUnavailable);
    const updated = await transaction.sponsoredCampaign.findUniqueOrThrow({ where: { id: input.campaignId }, include: campaignInclude });
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'SPONSORED_CAMPAIGN', targetId: updated.id, summary: 'An administrator recorded campaign payment confirmation.', metadata: { budgetAmount: Number(updated.budgetAmount), paymentProvider: 'MANUAL_RECORD_ONLY' } } });
    await transaction.notification.createMany({ data: [{ recipientId: campaign.landlordId, type: NotificationType.SPONSORED_CAMPAIGN_UPDATE, title: 'Campaign payment recorded', message: 'A school administrator recorded your campaign payment. Placement begins during the approved dates.', href: '/landlord/ads', deduplicationKey: 'campaign:' + updated.id + ':payment', scheduledFor: new Date() }], skipDuplicates: true });
    return updated;
  });
}

export async function changeLandlordSponsoredCampaignStatus(input: { campaignId: string; landlordId: string; pause: boolean }) {
  const campaign = await prismaDatabaseClient.sponsoredCampaign.findFirst({ where: { id: input.campaignId, landlordId: input.landlordId }, select: { id: true, status: true, paymentConfirmedAt: true, endsAt: true } });
  if (!campaign) throw new NotFoundError(ERROR_MESSAGES.sponsoredCampaignNotFound);
  if (input.pause && campaign.status !== SponsoredCampaignStatus.APPROVED) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignPauseUnavailable);
  if (!input.pause && (campaign.status !== SponsoredCampaignStatus.PAUSED || !campaign.paymentConfirmedAt || campaign.endsAt <= new Date())) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignPauseUnavailable);
  return prismaDatabaseClient.sponsoredCampaign.update({ where: { id: campaign.id }, data: { status: input.pause ? SponsoredCampaignStatus.PAUSED : SponsoredCampaignStatus.APPROVED }, include: campaignInclude });
}

export async function findEligibleSponsoredCampaigns(input: { properties: { id: string; city: string; universityId: string | null }[] }) {
  if (!input.properties.length) return [];
  const candidates = await prismaDatabaseClient.sponsoredCampaign.findMany({ where: { propertyId: { in: input.properties.map((property) => property.id) }, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: { not: null }, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } }, orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }], take: 100, select: { id: true, propertyId: true, headline: true, description: true, targetCity: true, targetUniversityId: true } });
  return candidates.filter((campaign) => input.properties.some((property) => property.id === campaign.propertyId && (!campaign.targetCity || campaign.targetCity.toLocaleLowerCase() === property.city.toLocaleLowerCase()) && (!campaign.targetUniversityId || campaign.targetUniversityId === property.universityId))).slice(0, SPONSORED_CAMPAIGN_LIMITS.publicPlacementCount);
}

export async function recordPublicCampaignEvent(input: { campaignId: string; eventType: 'IMPRESSION' | 'CLICK' }) {
  const now = new Date();
  const changed = await prismaDatabaseClient.sponsoredCampaign.updateMany({ where: { id: input.campaignId, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: { not: null }, startsAt: { lte: now }, endsAt: { gt: now } }, data: input.eventType === 'IMPRESSION' ? { impressionCount: { increment: 1 } } : { clickCount: { increment: 1 } } });
  if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.sponsoredCampaignNotFound);
  return { recorded: true };
}
