import { changeLandlordUnitAvailability as updateUnitAvailability } from '../../../repositories/propertyUnitAvailability.repository.js';
export async function changeLandlordUnitAvailability(input: Parameters<typeof updateUnitAvailability>[0]) { return updateUnitAvailability(input); }
