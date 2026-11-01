import { submitRentalApplication } from '../../../repositories/rentalApplication.repository.js';

export function createRentalApplication(input: { studentId: string; inspectionId: string; moveInDate?: Date; studentMessage?: string; requestId?: string }) {
  return submitRentalApplication(input);
}
