import type { AdminActionType, PropertyReportCategory, PropertyReportStatus } from '../enums/index.js';
import type { UserRole } from '../enums/userRole.enum.js';

export interface AdminDecisionDto {
  adminId: string;
  requestId?: string;
  reason: string;
}

export interface ChangeAccountStatusDto extends AdminDecisionDto {
  userId: string;
  isActive: boolean;
}

export interface ChangePropertyStatusDto extends AdminDecisionDto {
  propertyId: string;
  action: 'SUSPEND' | 'RESTORE';
}

export interface SubmitPropertyReportDto {
  reporterId: string;
  requestId?: string;
  propertyId: string;
  category: PropertyReportCategory;
  description: string;
}

export interface ReviewPropertyReportDto extends AdminDecisionDto {
  reportId: string;
  status: Extract<PropertyReportStatus, 'REVIEWED' | 'DISMISSED'>;
}

export type AdminAuditActionType = AdminActionType;

export interface CreateAdminStaffDto {
  actorId: string;
  requestId?: string;
  email: string;
  fullName: string;
  password: string;
  role: Exclude<UserRole, 'STUDENT' | 'LANDLORD' | 'CARETAKER' | 'SUPER_ADMIN'>;
}

export interface ChangeAdminStaffStatusDto {
  actorId: string;
  requestId?: string;
  userId: string;
  isActive: boolean;
}
