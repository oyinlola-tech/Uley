import type { RespondToInspectionDto } from '../../../dtos/inspection.dto.js';
import { updateLandlordInspectionResponse } from '../../../repositories/inspection.repository.js';

export async function respondToInspectionRequest(input: RespondToInspectionDto) {
  return updateLandlordInspectionResponse(input);
}
