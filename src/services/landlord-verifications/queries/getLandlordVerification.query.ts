import { getLandlordVerification } from '../../../repositories/propertyManagement.repository.js';

export async function getLandlordVerificationStatus(landlordId: string) {
  return getLandlordVerification(landlordId);
}
