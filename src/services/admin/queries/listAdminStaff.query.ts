import { listAdminStaff as loadStaff } from '../../../repositories/adminStaff.repository.js';

export function listAdministratorStaff() {
  return loadStaff();
}
