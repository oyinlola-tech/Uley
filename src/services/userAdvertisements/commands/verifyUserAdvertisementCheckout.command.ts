import { SponsoredCampaignCheckoutStatus } from '@prisma/client';
import { findUserAdvertisementCheckout, releaseUserAdvertisementCheckout } from '../../../repositories/userAdvertisementCheckout.repository.js';
import { verifyBachsUserAdvertisementCheckout } from '../../sponsoredCampaigns/payments/bachsPayment.service.js';

export async function verifyUserAdvertisementCheckout(input: { advertiserId: string; reference: string }) {
  const checkout = await findUserAdvertisementCheckout(input.reference, input.advertiserId);
  if (checkout.status === SponsoredCampaignCheckoutStatus.PAID) return { paid: true, checkout };
  if (checkout.status !== SponsoredCampaignCheckoutStatus.PENDING || !checkout.providerCheckoutId) return { paid: false, checkout };
  const verification = await verifyBachsUserAdvertisementCheckout({ reference: checkout.reference, providerCheckoutId: checkout.providerCheckoutId });
  if (verification.paid && verification.checkout) return verification;
  if (checkout.expiresAt <= new Date()) { await releaseUserAdvertisementCheckout(checkout.id); return { paid: false, checkout: await findUserAdvertisementCheckout(input.reference, input.advertiserId) }; }
  return { paid: false, checkout };
}
