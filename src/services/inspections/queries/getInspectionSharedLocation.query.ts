import type { InspectionLocationAccessDto } from '../../../dtos/inspectionLocationShare.dto.js';
import { findInspectionSharedLocation } from '../../../repositories/inspectionLocationShare.repository.js';

export function getInspectionSharedLocation(query: InspectionLocationAccessDto) {
  return findInspectionSharedLocation(query);
}
