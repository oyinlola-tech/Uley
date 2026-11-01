import type { ChangeAdminStaffStatusDto } from '../../../dtos/adminManagement.dto.js';
import { changeAdminStaffStatus as saveStatus } from '../../../repositories/adminStaff.repository.js';

export function changeAdministratorStaffStatus(input: ChangeAdminStaffStatusDto) {
  return saveStatus(input);
}
