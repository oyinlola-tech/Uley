import { listPropertyCaretakers } from '../../../repositories/propertyCaretaker.repository.js';
export async function getPropertyCaretakers(propertyId: string, landlordId: string) {
  return listPropertyCaretakers(propertyId, landlordId);
}
