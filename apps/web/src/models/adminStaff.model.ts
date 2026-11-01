import type { AccountRole } from '../enums';

export interface AdminStaffMember {
  id: string;
  fullName: string;
  email: string;
  role: AccountRole;
  isActive: boolean;
  createdAt: string;
}
