import { listOpenPropertyReports as loadReports } from '../../../repositories/adminDashboard.repository.js';

export async function listOpenReportedProperties() {
  return loadReports();
}
