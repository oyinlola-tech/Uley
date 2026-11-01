import type { ReviewVerificationDto } from '../../../dtos/propertyManagement.dto.js';
import { reviewLandlordVerification as saveDecision } from '../../../repositories/propertyManagement.repository.js';

export async function reviewLandlordVerification(landlordId: string, decision: ReviewVerificationDto) {
  return saveDecision(landlordId, decision);
}
