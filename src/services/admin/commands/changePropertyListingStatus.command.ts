import type { ChangePropertyStatusDto } from '../../../dtos/adminManagement.dto.js';
import { changePropertyListingStatus as saveStatus } from '../../../repositories/adminDashboard.repository.js';

export async function changeAdminManagedPropertyStatus(input: ChangePropertyStatusDto) {
  return saveStatus(input);
}
