import { NotificationType, SponsoredCampaignCheckoutStatus, SystemLogEventType, SystemLogLevel, UserAdvertisementStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { USER_ADVERTISEMENT_LIMITS } from '../constants/userAdvertisement.constant.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function reserveUserAdvertisementCheckout(input: { advertiserId: string; advertisementIds: string[]; reference: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const ads = await transaction.userAdvertisement.findMany({ where: { id: { in: input.advertisementIds }, advertiserId: input.advertiserId, status: UserAdvertisementStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, select: { id: true, budgetAmount: true } });
    if (ads.length !== input.advertisementIds.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const amounts = ads.map((ad) => ({ advertisementId: ad.id, amountKobo: BigInt(Math.round(Number(ad.budgetAmount) * 100)) }));
    const amountKobo = amounts.reduce((total, item) => total + item.amountKobo, 0n);
    if (amountKobo <= 0n || amountKobo > BigInt(Number.MAX_SAFE_INTEGER)) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const checkout = await transaction.userAdvertisementCheckout.create({ data: { advertiserId: input.advertiserId, reference: input.reference, amountKobo, authorizationUrl: '', expiresAt: new Date(Date.now() + USER_ADVERTISEMENT_LIMITS.checkoutExpiryMilliseconds) } });
    const reservation = await transaction.userAdvertisement.updateMany({ where: { id: { in: input.advertisementIds }, advertiserId: input.advertiserId, status: UserAdvertisementStatus.APPROVED, paymentConfirmedAt: null, checkoutReservationId: null }, data: { checkoutReservationId: checkout.id } });
    if (reservation.count !== ads.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    await transaction.userAdvertisementCheckoutItem.createMany({ data: amounts.map((item) => ({ checkoutId: checkout.id, ...item })) });
    return checkout;
  });
}

export function attachUserAdvertisementCheckoutAuthorization(input: { checkoutId: string; providerCheckoutId: string; authorizationUrl: string; expiresAt: Date }) {
  return prismaDatabaseClient.userAdvertisementCheckout.update({ where: { id: input.checkoutId }, data: { providerCheckoutId: input.providerCheckoutId, authorizationUrl: input.authorizationUrl, expiresAt: input.expiresAt } });
}

export async function releaseUserAdvertisementCheckout(checkoutId: string) {
  await prismaDatabaseClient.$transaction(async (transaction) => {
    await transaction.userAdvertisementCheckout.updateMany({ where: { id: checkoutId, status: SponsoredCampaignCheckoutStatus.PENDING }, data: { status: SponsoredCampaignCheckoutStatus.FAILED } });
    await transaction.userAdvertisement.updateMany({ where: { checkoutReservationId: checkoutId, paymentConfirmedAt: null }, data: { checkoutReservationId: null } });
  });
}

export async function findUserAdvertisementCheckout(reference: string, advertiserId: string) {
  const checkout = await prismaDatabaseClient.userAdvertisementCheckout.findFirst({ where: { reference, advertiserId } });
  if (!checkout) throw new NotFoundError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  return checkout;
}

export async function applyVerifiedUserAdvertisementCheckoutPayment(input: { reference: string; amountKobo: bigint; currency: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const checkout = await transaction.userAdvertisementCheckout.findUnique({ where: { reference: input.reference }, include: { items: true } });
    if (!checkout || checkout.amountKobo !== input.amountKobo || checkout.currency !== input.currency) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    if (checkout.status === SponsoredCampaignCheckoutStatus.PAID) return checkout;
    if (checkout.status !== SponsoredCampaignCheckoutStatus.PENDING) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutExpired);
    const paid = await transaction.userAdvertisement.updateMany({ where: { id: { in: checkout.items.map((item) => item.advertisementId) }, checkoutReservationId: checkout.id, status: UserAdvertisementStatus.APPROVED, paymentConfirmedAt: null }, data: { paymentConfirmedAt: new Date(), checkoutReservationId: null } });
    if (paid.count !== checkout.items.length) throw new ConflictError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
    const paidCheckout = await transaction.userAdvertisementCheckout.update({ where: { id: checkout.id }, data: { status: SponsoredCampaignCheckoutStatus.PAID, paidAt: new Date() } });
    await transaction.notification.createMany({ data: [{ recipientId: checkout.advertiserId, type: NotificationType.SPONSORED_CAMPAIGN_UPDATE, title: 'Ad payment confirmed', message: `${checkout.items.length} approved ad${checkout.items.length === 1 ? '' : 's'} paid successfully.`, href: '/ads', deduplicationKey: `user-ad-checkout:${checkout.id}:paid`, scheduledFor: new Date() }], skipDuplicates: true });
    await transaction.systemLog.create({ data: { eventType: SystemLogEventType.SPONSORED_CAMPAIGN_PAYMENT, level: SystemLogLevel.INFO, targetType: 'USER_ADVERTISEMENT_CHECKOUT', targetId: checkout.id, summary: 'A Bachs checkout was verified and applied to user advertisements.', metadata: { adCount: checkout.items.length, amountKobo: checkout.amountKobo.toString(), currency: checkout.currency } } });
    return paidCheckout;
  });
}

export function findUserAdvertisementCheckoutByProviderId(providerCheckoutId: string) { return prismaDatabaseClient.userAdvertisementCheckout.findUnique({ where: { providerCheckoutId } }); }
