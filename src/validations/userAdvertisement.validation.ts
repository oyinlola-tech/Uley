import { UserAdvertisementCategory } from '@prisma/client';
import { z } from 'zod';
import { USER_ADVERTISEMENT_LIMITS } from '../constants/userAdvertisement.constant.js';

export const createUserAdvertisementSchema = z.object({
  category: z.nativeEnum(UserAdvertisementCategory),
  title: z.string().trim().min(5).max(USER_ADVERTISEMENT_LIMITS.titleMaximumLength),
  description: z.string().trim().min(USER_ADVERTISEMENT_LIMITS.descriptionMinimumLength).max(USER_ADVERTISEMENT_LIMITS.descriptionMaximumLength),
  city: z.string().trim().min(2).max(USER_ADVERTISEMENT_LIMITS.cityMaximumLength),
  budgetAmount: z.number().min(USER_ADVERTISEMENT_LIMITS.minimumBudgetAmount).max(USER_ADVERTISEMENT_LIMITS.maximumBudgetAmount),
  ctaLabel: z.string().trim().min(2).max(USER_ADVERTISEMENT_LIMITS.maximumCtaLabelLength),
  ctaUrl: z.url().max(500).refine((value) => new URL(value).protocol === 'https:').optional(),
  presentationStyle: z.enum(USER_ADVERTISEMENT_LIMITS.presentationStyles),
}).strict();

export const reviewUserAdvertisementSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  decisionNote: z.string().trim().max(500).optional(),
}).strict();

export const updateUserAdvertisementStatusSchema = z.object({ status: z.enum(['APPROVED', 'PAUSED']) }).strict();
export const userAdvertisementEventSchema = z.object({ eventType: z.enum(['IMPRESSION', 'CLICK']) }).strict();
export const createUserAdvertisementCheckoutSchema = z.object({ advertisementIds: z.array(z.uuid()).min(1).max(10) }).strict().refine((value) => new Set(value.advertisementIds).size === value.advertisementIds.length);
export const verifyUserAdvertisementCheckoutSchema = z.object({ reference: z.string().trim().min(8).max(100) }).strict();
