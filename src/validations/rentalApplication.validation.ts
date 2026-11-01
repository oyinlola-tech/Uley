import { RentalApplicationStatus } from '@prisma/client';
import { z } from 'zod';

export const createRentalApplicationSchema = z.object({
  inspectionId: z.string().uuid(),
  moveInDate: z.coerce.date().optional(),
  studentMessage: z.string().trim().max(1500).optional(),
}).strict();

export const rentalApplicationResponseSchema = z.object({
  status: z.enum([RentalApplicationStatus.UNDER_REVIEW, RentalApplicationStatus.APPROVED, RentalApplicationStatus.DECLINED]),
  landlordResponse: z.string().trim().max(1000).optional(),
}).strict();
