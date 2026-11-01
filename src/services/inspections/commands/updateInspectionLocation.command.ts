import type { UpdateInspectionLocationDto } from '../../../dtos/inspectionLocationShare.dto.js';
import { updateInspectionLocation as updateLocation } from '../../../repositories/inspectionLocationShare.repository.js';

export function updateInspectionLocation(command: UpdateInspectionLocationDto) {
  return updateLocation(command);
}
