import type { InspectionLocationAccessDto } from '../../../dtos/inspectionLocationShare.dto.js';
import { startInspectionLocationShare as startShare } from '../../../repositories/inspectionLocationShare.repository.js';

export function startInspectionLocationShare(command: InspectionLocationAccessDto) {
  return startShare(command);
}
