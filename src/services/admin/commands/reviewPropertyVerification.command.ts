import type { ReviewVerificationDto } from '../../../dtos/propertyManagement.dto.js';
import { reviewPropertyVerification as saveDecision } from '../../../repositories/propertyManagement.repository.js';

export async function reviewPropertyVerification(propertyId: string, decision: ReviewVerificationDto) {
  return saveDecision(propertyId, decision);
}
