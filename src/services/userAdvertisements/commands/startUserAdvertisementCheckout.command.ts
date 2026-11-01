import { randomUUID } from 'node:crypto';
import { USER_ADVERTISEMENT_LIMITS } from '../../../constants/userAdvertisement.constant.js';
import { attachUserAdvertisementCheckoutAuthorization, releaseUserAdvertisementCheckout, reserveUserAdvertisementCheckout } from '../../../repositories/userAdvertisementCheckout.repository.js';
import { createBachsSponsoredCheckout } from '../../sponsoredCampaigns/payments/bachsPayment.service.js';

export async function startUserAdvertisementCheckout(input: { advertiserId: string; email: string; advertisementIds: string[] }) {
  const reference = `${USER_ADVERTISEMENT_LIMITS.checkoutReferencePrefix}${randomUUID().replaceAll('-', '')}`;
  const checkout = await reserveUserAdvertisementCheckout({ advertiserId: input.advertiserId, advertisementIds: input.advertisementIds, reference });
  try {
    const session = await createBachsSponsoredCheckout({ email: input.email, reference, checkoutId: checkout.id, amountKobo: checkout.amountKobo, checkoutType: 'user_advertisement' });
    return attachUserAdvertisementCheckoutAuthorization({ checkoutId: checkout.id, ...session });
  } catch (error) {
    await releaseUserAdvertisementCheckout(checkout.id);
    throw error;
  }
}
