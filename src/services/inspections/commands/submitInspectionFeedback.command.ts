import type { SubmitInspectionFeedbackDto } from '../../../dtos/inspectionLifecycle.dto.js';
import { submitInspectionFeedback } from '../../../repositories/inspectionLifecycle.repository.js';

export async function recordInspectionFeedback(input: SubmitInspectionFeedbackDto) {
  return submitInspectionFeedback(input);
}
