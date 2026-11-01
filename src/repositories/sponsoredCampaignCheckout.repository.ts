import { NotificationType, SponsoredCampaignCheckoutStatus, SponsoredCampaignStatus, SystemLogEventType, SystemLogLevel } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { SPONSORED_CAMPAIGN_LIMITS } from '../constants/sponsoredCampaign.constant.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function reserveSponsoredCampaignCheckout(input: { landlordId: string; campaignIds: string[]; reference: string }) {
  const now = new Date();
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const campaigns = await transaction.sponsoredCampaign.findMany({ where: { id: { in: input.campaignIds }, landlordId: input.landlordId, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, select: { id: true, budgetAmount: true } });
    if (campaigns.length !== input.campaignIds.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const campaignAmounts = campaigns.map((campaign) => ({ campaignId: campaign.id, amountKobo: BigInt(Math.round(Number(campaign.budgetAmount) * 100)) }));
    const amountKobo = campaignAmounts.reduce((total, item) => total + item.amountKobo, 0n);
    if (amountKobo <= 0n || amountKobo > BigInt(Number.MAX_SAFE_INTEGER)) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const checkout = await transaction.sponsoredCampaignCheckout.create({ data: { landlordId: input.landlordId, reference: input.reference, amountKobo, authorizationUrl: '', expiresAt: new Date(now.getTime() + SPONSORED_CAMPAIGN_LIMITS.checkoutExpiryMilliseconds) } });
    const reserved = await transaction.sponsoredCampaign.updateMany({ where: { id: { in: input.campaignIds }, landlordId: input.landlordId, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, data: { checkoutReservationId: checkout.id } });
    if (reserved.count !== input.campaignIds.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    await transaction.sponsoredCampaignCheckoutItem.createMany({ data: campaignAmounts.map((item) => ({ checkoutId: checkout.id, ...item })) });
    return checkout;
  });
}

export async function attachSponsoredCheckoutAuthorization(input: { checkoutId: string; providerCheckoutId: string; authorizationUrl: string; expiresAt: Date }) {
  return prismaDatabaseClient.sponsoredCampaignCheckout.update({ where: { id: input.checkoutId }, data: { providerCheckoutId: input.providerCheckoutId, authorizationUrl: input.authorizationUrl, expiresAt: input.expiresAt }, select: { id: true, reference: true, authorizationUrl: true, amountKobo: true, expiresAt: true } });
}

export async function releaseSponsoredCampaignCheckout(checkoutId: string) {
  await prismaDatabaseClient.$transaction(async (transaction) => {
    await transaction.sponsoredCampaignCheckout.updateMany({ where: { id: checkoutId, status: SponsoredCampaignCheckoutStatus.PENDING }, data: { status: SponsoredCampaignCheckoutStatus.FAILED } });
    await transaction.sponsoredCampaign.updateMany({ where: { checkoutReservationId: checkoutId, paymentConfirmedAt: null }, data: { checkoutReservationId: null } });
  });
}

export async function findLandlordCheckout(reference: string, landlordId: string) {
  const checkout = await prismaDatabaseClient.sponsoredCampaignCheckout.findFirst({
    where: { reference, landlordId },
    include: { items: { include: { campaign: { select: { id: true, headline: true, property: { select: { name: true } } } } } } },
  });
  if (!checkout) throw new NotFoundError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  return checkout;
}

export async function applyVerifiedSponsoredCheckoutPayment(input: { reference: string; amountKobo: bigint; currency: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const checkout = await transaction.sponsoredCampaignCheckout.findUnique({ where: { reference: input.reference }, include: { items: true } });
    if (!checkout || checkout.amountKobo !== input.amountKobo || checkout.currency !== input.currency) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    if (checkout.status === SponsoredCampaignCheckoutStatus.PAID) return checkout;
    if (checkout.status !== SponsoredCampaignCheckoutStatus.PENDING) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutExpired);
    const campaignUpdate = await transaction.sponsoredCampaign.updateMany({ where: { id: { in: checkout.items.map((item) => item.campaignId) }, checkoutReservationId: checkout.id, status: SponsoredCampaignStatus.APPROVED, paymentConfirmedAt: null }, data: { paymentConfirmedAt: new Date(), checkoutReservationId: null } });
    if (campaignUpdate.count !== checkout.items.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const paidCheckout = await transaction.sponsoredCampaignCheckout.update({ where: { id: checkout.id }, data: { status: SponsoredCampaignCheckoutStatus.PAID, paidAt: new Date() } });
    await transaction.notification.createMany({ data: [{ recipientId: checkout.landlordId, type: NotificationType.SPONSORED_CAMPAIGN_UPDATE, title: 'Sponsored campaign payment confirmed', message: `${checkout.items.length} approved campaign${checkout.items.length === 1 ? '' : 's'} paid successfully.`, href: '/landlord/ads', deduplicationKey: `campaign-checkout:${checkout.id}:paid`, scheduledFor: new Date() }], skipDuplicates: true });
    await transaction.systemLog.create({ data: { eventType: SystemLogEventType.SPONSORED_CAMPAIGN_PAYMENT, level: SystemLogLevel.INFO, targetType: 'SPONSORED_CAMPAIGN_CHECKOUT', targetId: checkout.id, summary: 'A Bachs checkout was verified and applied to sponsored campaigns.', metadata: { campaignCount: checkout.items.length, amountKobo: checkout.amountKobo.toString(), currency: checkout.currency } } });
    return paidCheckout;
  });
}

export async function findSponsoredCheckoutByProviderId(providerCheckoutId: string) {
  return prismaDatabaseClient.sponsoredCampaignCheckout.findUnique({ where: { providerCheckoutId } });
}

