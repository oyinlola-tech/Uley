import type { CreateAdminStaffDto } from '../../../dtos/adminManagement.dto.js';
import { createAdminStaff as saveAdminStaff } from '../../../repositories/adminStaff.repository.js';
import { hashAccountPassword } from '../../../utils/password.js';

export async function createAdministratorStaff(input: CreateAdminStaffDto) {
  return saveAdminStaff({ ...input, password: await hashAccountPassword(input.password) });
}
