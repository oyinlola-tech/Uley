import { UserAdvertisementCategory, UserAdvertisementStatus, UserRole, BusinessAdvertiserStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { USER_ADVERTISEMENT_LIMITS } from '../constants/userAdvertisement.constant.js';
import { ConflictError, NotFoundError, TooManyRequestsError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

const publicUserAdInclude = { advertiser: { select: { id: true, fullName: true, university: { select: { name: true } }, businessAdvertiserProfile: { select: { businessName: true } } } } };

export async function createUserAdvertisement(input: { advertiserId: string; universityId?: string; category: UserAdvertisementCategory; title: string; description: string; city: string; budgetAmount: number; ctaLabel: string; ctaUrl?: string; presentationStyle: 'FEATURED' | 'COMPACT' }) {
  const since = new Date(Date.now() - USER_ADVERTISEMENT_LIMITS.postRateWindowMilliseconds);
  const recentCount = await prismaDatabaseClient.userAdvertisement.count({ where: { advertiserId: input.advertiserId, createdAt: { gte: since } } });
  if (recentCount >= USER_ADVERTISEMENT_LIMITS.maximumPostsPerDay) throw new TooManyRequestsError(ERROR_MESSAGES.userAdvertisementLimitReached);
  return prismaDatabaseClient.userAdvertisement.create({ data: { ...input, endsAt: new Date(Date.now() + USER_ADVERTISEMENT_LIMITS.lifetimeMilliseconds) }, include: publicUserAdInclude });
}

export async function findUserAdvertisements(input: { userId: string; userRole: UserRole; category?: UserAdvertisementCategory; city?: string; universityId?: string; page: number }) {
  if (input.userRole !== UserRole.STUDENT) return { ads: [], page: 1, pageSize: USER_ADVERTISEMENT_LIMITS.feedPageSize, total: 0, pageCount: 0, remainingDailyImpressions: 0 };
  const blocked = await prismaDatabaseClient.userBlock.findMany({ where: { OR: [{ blockerId: input.userId }, { blockedUserId: input.userId }] }, select: { blockerId: true, blockedUserId: true } });
  const blockedIds = blocked.map((item) => item.blockerId === input.userId ? item.blockedUserId : item.blockerId);
  const viewDate = getUtcViewDate();
  const exposures = await prismaDatabaseClient.userAdvertisementExposure.findMany({ where: { viewerId: input.userId, viewDate }, select: { advertisementId: true } });
  const remainingDailyImpressions = Math.max(0, USER_ADVERTISEMENT_LIMITS.maximumFeedImpressionsPerUserPerDay - exposures.length);
  if (!remainingDailyImpressions) return { ads: [], page: 1, pageSize: USER_ADVERTISEMENT_LIMITS.feedPageSize, total: 0, pageCount: 0, remainingDailyImpressions };
  const where = { status: UserAdvertisementStatus.APPROVED, paymentConfirmedAt: { not: null }, startsAt: { lte: new Date() }, endsAt: { gt: new Date() }, advertiserId: { not: input.userId, notIn: blockedIds }, advertiser: { isActive: true }, ...(exposures.length ? { id: { notIn: exposures.map((exposure) => exposure.advertisementId) } } : {}), ...(input.category ? { category: input.category } : {}), ...(input.city ? { city: { contains: input.city, mode: 'insensitive' as const } } : {}), ...(input.universityId ? { OR: [{ universityId: input.universityId }, { universityId: null }] } : {}) };
  const [ads, total] = await Promise.all([prismaDatabaseClient.userAdvertisement.findMany({ where, include: publicUserAdInclude, orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }], take: USER_ADVERTISEMENT_LIMITS.feedPageSize }), prismaDatabaseClient.userAdvertisement.count({ where })]);
  return { ads, page: 1, pageSize: USER_ADVERTISEMENT_LIMITS.feedPageSize, total, pageCount: Number(Boolean(total)), remainingDailyImpressions };
}

function getUtcViewDate() { return new Date().toISOString().slice(0, 10); }

export function findOwnUserAdvertisements(advertiserId: string) {
  return prismaDatabaseClient.userAdvertisement.findMany({ where: { advertiserId }, include: { checkoutReservation: true }, orderBy: { createdAt: 'desc' }, take: USER_ADVERTISEMENT_LIMITS.ownerPageSize });
}

export async function getUserAdvertisementAnalytics(advertiserId: string) {
  const ads = await findOwnUserAdvertisements(advertiserId);
  const totals = ads.reduce((result, ad) => ({ impressions: result.impressions + ad.impressionCount, clicks: result.clicks + ad.clickCount }), { impressions: 0, clicks: 0 });
  return { ...totals, clickThroughRate: totals.impressions ? Number((totals.clicks / totals.impressions * 100).toFixed(2)) : 0, activeAds: ads.filter((ad) => ad.status === UserAdvertisementStatus.APPROVED && ad.paymentConfirmedAt && ad.endsAt > new Date()).length, ads };
}

export async function recordUserAdvertisementEvent(input: { advertisementId: string; viewerId: string; eventType: 'IMPRESSION' | 'CLICK' }) {
  const active = { id: input.advertisementId, status: UserAdvertisementStatus.APPROVED, paymentConfirmedAt: { not: null }, startsAt: { lte: new Date() }, endsAt: { gt: new Date() } };
  if (input.eventType === 'IMPRESSION') return recordUserAdvertisementImpression(input, active);
  const changed = await prismaDatabaseClient.userAdvertisement.updateMany({ where: active, data: { clickCount: { increment: 1 } } });
  if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
  return { recorded: true };
}

async function recordUserAdvertisementImpression(input: { advertisementId: string; viewerId: string }, active: { id: string; status: UserAdvertisementStatus; paymentConfirmedAt: { not: null }; startsAt: { lte: Date }; endsAt: { gt: Date } }) {
  const viewDate = getUtcViewDate();
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const existing = await transaction.userAdvertisementExposure.findUnique({ where: { viewerId_advertisementId_viewDate: { viewerId: input.viewerId, advertisementId: input.advertisementId, viewDate } } });
    if (existing) return { recorded: false, remainingDailyImpressions: await getRemainingDailyImpressions(transaction, input.viewerId, viewDate) };
    const remaining = await getRemainingDailyImpressions(transaction, input.viewerId, viewDate);
    if (!remaining) return { recorded: false, remainingDailyImpressions: 0 };
    const changed = await transaction.userAdvertisement.updateMany({ where: active, data: { impressionCount: { increment: 1 } } });
    if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
    await transaction.userAdvertisementExposure.create({ data: { viewerId: input.viewerId, advertisementId: input.advertisementId, viewDate } });
    return { recorded: true, remainingDailyImpressions: remaining - 1 };
  }, { isolationLevel: 'Serializable' });
}

async function getRemainingDailyImpressions(transaction: Pick<typeof prismaDatabaseClient, 'userAdvertisementExposure'>, viewerId: string, viewDate: string) {
  const impressions = await transaction.userAdvertisementExposure.count({ where: { viewerId, viewDate } });
  return Math.max(0, USER_ADVERTISEMENT_LIMITS.maximumFeedImpressionsPerUserPerDay - impressions);
}

export async function changeOwnUserAdvertisementStatus(input: { advertisementId: string; advertiserId: string; status: 'APPROVED' | 'PAUSED' }) {
  const ad = await prismaDatabaseClient.userAdvertisement.findFirst({ where: { id: input.advertisementId, advertiserId: input.advertiserId } });
  if (!ad || ad.endsAt <= new Date() || !(['APPROVED', 'PAUSED'] as const).includes(ad.status as 'APPROVED' | 'PAUSED')) throw new ConflictError(ERROR_MESSAGES.userAdvertisementUnavailable);
  return prismaDatabaseClient.userAdvertisement.update({ where: { id: ad.id }, data: { status: input.status } });
}

export function findPendingUserAdvertisements() {
  return prismaDatabaseClient.userAdvertisement.findMany({ where: { status: UserAdvertisementStatus.PENDING_REVIEW }, include: { university: { select: { name: true } }, advertiser: { select: { id: true, fullName: true, email: true, role: true, businessAdvertiserProfile: { select: { businessName: true, status: true } } } } }, orderBy: { createdAt: 'asc' }, take: 100 });
}

export async function reviewUserAdvertisement(input: { advertisementId: string; reviewerId: string; decision: 'APPROVE' | 'REJECT'; decisionNote?: string; requestId: string }) {
  const status = input.decision === 'APPROVE' ? UserAdvertisementStatus.APPROVED : UserAdvertisementStatus.REJECTED;
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const ad = await transaction.userAdvertisement.findUnique({ where: { id: input.advertisementId }, include: { advertiser: { select: { role: true, businessAdvertiserProfile: true } } } });
    if (!ad || (ad.advertiser.role === UserRole.BUSINESS_ADVERTISER && !ad.advertiser.businessAdvertiserProfile)) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
    const changed = await transaction.userAdvertisement.updateMany({ where: { id: input.advertisementId, status: UserAdvertisementStatus.PENDING_REVIEW }, data: { status, reviewedById: input.reviewerId, reviewedAt: new Date(), ...(input.decisionNote ? { decisionNote: input.decisionNote } : {}) } });
    if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
    if (input.decision === 'APPROVE' && ad.advertiser.role === UserRole.BUSINESS_ADVERTISER) await transaction.businessAdvertiserProfile.update({ where: { userId: ad.advertiserId }, data: { status: BusinessAdvertiserStatus.APPROVED, reviewedById: input.reviewerId, reviewedAt: new Date() } });
    await transaction.notification.createMany({ data: [{ recipientId: ad.advertiserId, type: 'SPONSORED_CAMPAIGN_UPDATE', title: input.decision === 'APPROVE' ? 'Your ad was approved' : 'Your ad needs changes', message: input.decisionNote ?? (input.decision === 'APPROVE' ? 'Your ad is approved. Complete payment to schedule its placement.' : 'A school moderator reviewed your ad.'), href: '/ads', deduplicationKey: `user-ad:${input.advertisementId}:reviewed`, scheduledFor: new Date() }], skipDuplicates: true });
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'USER_ADVERTISEMENT', targetId: input.advertisementId, summary: 'A student advertisement received a moderation decision.', metadata: { decision: input.decision, ...(input.decisionNote ? { note: input.decisionNote } : {}) } } });
    return transaction.userAdvertisement.findUniqueOrThrow({ where: { id: input.advertisementId }, include: publicUserAdInclude });
  });
}
