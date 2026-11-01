import { findLandlordOccupancies } from '../../../repositories/occupancy.repository.js';

export async function listLandlordOccupancies(landlordId: string) {
  return findLandlordOccupancies(landlordId);
}
