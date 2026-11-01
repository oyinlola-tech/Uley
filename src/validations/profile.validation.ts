import { RentalPeriod } from '@prisma/client';
import { z } from 'zod';
import { USER_PROFILE_LIMITS } from '../constants/profile.constant.js';

export const updateUserProfileSchema = z.object({
  bio: z.string().trim().max(600).nullable().optional(),
  courseOfStudy: z.string().trim().max(160).nullable().optional(),
  studyYear: z.number().int().min(1).max(8).nullable().optional(),
  interests: z.array(z.string().trim().min(2).max(USER_PROFILE_LIMITS.interestLengthMaximum)).max(USER_PROFILE_LIMITS.interestsMaximum).optional(),
  isDiscoverable: z.boolean().optional(),
  seekingRoommate: z.boolean().optional(),
  roommateCity: z.string().trim().max(100).nullable().optional(),
  roommateNeighborhood: z.string().trim().max(120).nullable().optional(),
  roommateBudget: z.number().positive().max(USER_PROFILE_LIMITS.roommateBudgetMaximum).nullable().optional(),
  roommateRentalPeriod: z.nativeEnum(RentalPeriod).nullable().optional(),
  moveInDate: z.coerce.date().nullable().optional(),
}).strict().refine((profile) => !profile.seekingRoommate || Boolean(profile.roommateCity && profile.roommateBudget && profile.roommateRentalPeriod), {
  message: 'Add a city, budget and rent period before appearing in roommate discovery.',
});

export const searchUserProfilesSchema = z.object({
  city: z.string().trim().max(100).optional(),
  universityId: z.string().uuid().optional(),
  maximumBudget: z.coerce.number().positive().max(USER_PROFILE_LIMITS.roommateBudgetMaximum).optional(),
  page: z.coerce.number().int().positive().default(1),
}).strict();
