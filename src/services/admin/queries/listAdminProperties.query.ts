import { listAdminProperties as loadProperties } from '../../../repositories/adminDashboard.repository.js';

export async function listAdminManagedProperties() {
  return loadProperties();
}
