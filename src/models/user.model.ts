import type { UserRole } from '../enums/userRole.enum.js';

export interface UserModel {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
