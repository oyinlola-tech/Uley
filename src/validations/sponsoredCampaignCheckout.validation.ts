import { z } from 'zod';
import { SPONSORED_CAMPAIGN_LIMITS } from '../constants/sponsoredCampaign.constant.js';

export const createSponsoredCampaignCheckoutSchema = z.object({
  campaignIds: z.array(z.string().uuid()).min(1).max(SPONSORED_CAMPAIGN_LIMITS.checkoutCampaignMaximumCount),
}).strict().refine((value) => new Set(value.campaignIds).size === value.campaignIds.length, { message: 'A sponsored listing can only appear once in a checkout.' });

export const verifySponsoredCampaignCheckoutSchema = z.object({ reference: z.string().trim().min(8).max(100) }).strict();
