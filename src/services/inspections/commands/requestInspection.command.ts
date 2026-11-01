import type { RequestInspectionDto } from '../../../dtos/inspection.dto.js';
import { createInspectionRequest } from '../../../repositories/inspection.repository.js';

export async function requestPropertyInspection(input: RequestInspectionDto) {
  return createInspectionRequest(input);
}
