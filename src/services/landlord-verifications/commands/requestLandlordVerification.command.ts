import { requestLandlordVerification as createRequest } from '../../../repositories/propertyManagement.repository.js';

export async function requestLandlordVerification(landlordId: string) {
  return createRequest(landlordId);
}
