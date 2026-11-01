import { listAdminAccounts as loadAccounts } from '../../../repositories/adminDashboard.repository.js';

export async function listAdminManagedAccounts() {
  return loadAccounts();
}
