import { findLandlordCheckout, releaseSponsoredCampaignCheckout } from '../../../repositories/sponsoredCampaignCheckout.repository.js';
import { verifyBachsSponsoredCheckout } from '../payments/bachsPayment.service.js';

export async function verifyOwnSponsoredCampaignCheckout(input: { landlordId: string; reference: string }) {
  const checkout = await findLandlordCheckout(input.reference, input.landlordId);
  if (checkout.status === 'PAID') return { paid: true, checkout };
  if (checkout.status !== 'PENDING') return { paid: false, checkout };
  if (!checkout.providerCheckoutId) return { paid: false, checkout };
  const verification = await verifyBachsSponsoredCheckout({ reference: checkout.reference, providerCheckoutId: checkout.providerCheckoutId });
  if (verification.paid && verification.checkout) return { paid: true, checkout: verification.checkout };
  if (checkout.expiresAt <= new Date()) {
    await releaseSponsoredCampaignCheckout(checkout.id);
    return { paid: false, checkout: await findLandlordCheckout(input.reference, input.landlordId) };
  }
  return { paid: false, checkout };
}
