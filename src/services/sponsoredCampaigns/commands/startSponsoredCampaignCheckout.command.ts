import { randomUUID } from 'node:crypto';
import { SPONSORED_CAMPAIGN_LIMITS } from '../../../constants/sponsoredCampaign.constant.js';
import { attachSponsoredCheckoutAuthorization, releaseSponsoredCampaignCheckout, reserveSponsoredCampaignCheckout } from '../../../repositories/sponsoredCampaignCheckout.repository.js';
import { createBachsSponsoredCheckout } from '../payments/bachsPayment.service.js';

export async function startSponsoredCampaignCheckout(input: { landlordId: string; email: string; campaignIds: string[] }) {
  const reference = `${SPONSORED_CAMPAIGN_LIMITS.checkoutReferencePrefix}${randomUUID().replaceAll('-', '')}`;
  const checkout = await reserveSponsoredCampaignCheckout({ landlordId: input.landlordId, campaignIds: input.campaignIds, reference });
  try {
    const session = await createBachsSponsoredCheckout({ email: input.email, reference, checkoutId: checkout.id, amountKobo: checkout.amountKobo });
    return attachSponsoredCheckoutAuthorization({ checkoutId: checkout.id, ...session });
  } catch (error) {
    await releaseSponsoredCampaignCheckout(checkout.id);
    throw error;
  }
}
