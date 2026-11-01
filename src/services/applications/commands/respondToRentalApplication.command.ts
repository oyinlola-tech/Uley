import type { RentalApplicationStatus } from '@prisma/client';
import { respondToRentalApplication as saveDecision } from '../../../repositories/rentalApplication.repository.js';

export function respondToRentalApplication(input: { applicationId: string; landlordId: string; status: RentalApplicationStatus; landlordResponse?: string; requestId?: string }) {
  return saveDecision(input);
}
