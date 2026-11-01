import type { ChangeAccountStatusDto } from '../../../dtos/adminManagement.dto.js';
import { changeAccountActiveStatus as saveStatus } from '../../../repositories/adminDashboard.repository.js';

export async function changeAdminManagedAccountStatus(input: ChangeAccountStatusDto) {
  return saveStatus(input);
}
