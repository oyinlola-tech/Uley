import type { InspectionLocationAccessDto } from '../../../dtos/inspectionLocationShare.dto.js';
import { stopInspectionLocationShare as stopShare } from '../../../repositories/inspectionLocationShare.repository.js';

export function stopInspectionLocationShare(command: InspectionLocationAccessDto) {
  return stopShare(command);
}
