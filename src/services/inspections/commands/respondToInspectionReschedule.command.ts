import type { RespondToInspectionRescheduleDto } from '../../../dtos/inspectionLifecycle.dto.js';
import { respondToInspectionReschedule } from '../../../repositories/inspectionLifecycle.repository.js';

export async function answerInspectionDateChange(input: RespondToInspectionRescheduleDto) {
  return respondToInspectionReschedule(input);
}
