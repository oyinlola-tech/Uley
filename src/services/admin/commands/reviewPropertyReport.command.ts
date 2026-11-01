import type { ReviewPropertyReportDto, SubmitPropertyReportDto } from '../../../dtos/adminManagement.dto.js';
import { reviewPropertyReport as saveReview, submitPropertyReport as saveReport } from '../../../repositories/adminDashboard.repository.js';

export async function submitReportAboutProperty(input: SubmitPropertyReportDto) {
  return saveReport(input);
}

export async function reviewReportedProperty(input: ReviewPropertyReportDto) {
  return saveReview(input);
}
