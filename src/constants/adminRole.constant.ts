import { UserRole } from '../enums/userRole.enum.js';

export const ADMIN_ROLE_PERMISSIONS = {
  dashboard: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.VERIFICATION_ADMIN, UserRole.SAFETY_ADMIN, UserRole.INSPECTION_ADMIN, UserRole.ACCOUNT_ADMIN],
  verification: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.VERIFICATION_ADMIN],
  safety: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SAFETY_ADMIN],
  contentModeration: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SAFETY_ADMIN],
  complaints: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SAFETY_ADMIN],
  inspections: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.INSPECTION_ADMIN],
  accounts: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNT_ADMIN],
  staffManagement: [UserRole.SUPER_ADMIN],
  systemLogs: [UserRole.SUPER_ADMIN],
} as const;
