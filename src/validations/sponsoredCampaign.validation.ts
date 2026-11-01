import { z } from 'zod';
import { SPONSORED_CAMPAIGN_LIMITS } from '../constants/sponsoredCampaign.constant.js';

export const createSponsoredCampaignSchema = z.object({
  propertyId: z.string().uuid(),
  targetUniversityId: z.string().uuid().optional(),
  targetCity: z.string().trim().max(120).optional(),
  headline: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(300),
  budgetAmount: z.number().min(SPONSORED_CAMPAIGN_LIMITS.minimumBudgetAmount).max(SPONSORED_CAMPAIGN_LIMITS.maximumBudgetAmount),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).strict().refine((campaign) => campaign.endsAt.getTime() > campaign.startsAt.getTime() && campaign.endsAt.getTime() - campaign.startsAt.getTime() <= SPONSORED_CAMPAIGN_LIMITS.maximumDurationMilliseconds, { message: 'Choose a campaign period of up to 30 days.' });

export const reviewSponsoredCampaignSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), decisionNote: z.string().trim().max(500).optional() }).strict().refine((value) => value.decision !== 'REJECT' || Boolean(value.decisionNote && value.decisionNote.length >= 10), { message: 'Provide at least 10 characters explaining a rejection.' });
export const pauseSponsoredCampaignSchema = z.object({ pause: z.boolean() }).strict();
export const confirmSponsoredPaymentSchema = z.object({ paymentConfirmed: z.literal(true) }).strict();
export const sponsoredCampaignEventSchema = z.object({ eventType: z.enum(['IMPRESSION', 'CLICK']) }).strict();
