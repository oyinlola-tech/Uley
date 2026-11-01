import { getAdminDashboardOverview as loadOverview } from '../../../repositories/adminDashboard.repository.js';

export async function getAdminDashboardOverview() {
  return loadOverview();
}
