import { withdrawRentalApplication as saveWithdrawal } from '../../../repositories/rentalApplication.repository.js';

export function withdrawRentalApplication(input: { applicationId: string; studentId: string; requestId?: string }) {
  return saveWithdrawal(input);
}
