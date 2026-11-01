import { findLandlordInspections } from '../../../repositories/inspection.repository.js';

export async function listLandlordInspectionRequests(landlordId: string) {
  return findLandlordInspections(landlordId);
}
