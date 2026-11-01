import type { RequestInspectionRescheduleDto } from '../../../dtos/inspectionLifecycle.dto.js';
import { requestInspectionReschedule } from '../../../repositories/inspectionLifecycle.repository.js';

export async function requestInspectionDateChange(input: RequestInspectionRescheduleDto) {
  return requestInspectionReschedule(input);
}
