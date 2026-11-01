import { listAdminInspectionRequests } from '../../../repositories/adminDashboard.repository.js';

export async function listInspectionRequestsForSchoolReview() {
  return listAdminInspectionRequests();
}
