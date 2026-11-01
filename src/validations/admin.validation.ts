import { z } from 'zod';
import { PropertyReportCategory } from '../enums/propertyReportCategory.enum.js';
import { PropertyReportStatus } from '../enums/propertyReportStatus.enum.js';
import { ADMIN_DASHBOARD_LIMITS } from '../constants/adminDashboard.constant.js';
import { ADMIN_STAFF_LIMITS } from '../constants/adminStaff.constant.js';
import { AUTH_VALIDATION_LIMITS } from '../constants/authValidation.constant.js';
import { CREATABLE_ADMIN_USER_ROLES } from '../enums/userRole.enum.js';

const reasonSchema = z.string().trim().min(ADMIN_DASHBOARD_LIMITS.reasonMinimumLength).max(ADMIN_DASHBOARD_LIMITS.reasonMaximumLength);

export const adminAccountStatusSchema = z.object({ isActive: z.boolean(), reason: reasonSchema }).strict();
export const adminPropertyStatusSchema = z.object({ action: z.enum(['SUSPEND', 'RESTORE']), reason: reasonSchema }).strict();
export const submitPropertyReportSchema = z.object({
  propertyId: z.string().uuid(),
  category: z.nativeEnum(PropertyReportCategory),
  description: z.string().trim().min(ADMIN_DASHBOARD_LIMITS.reportDescriptionMinimumLength).max(ADMIN_DASHBOARD_LIMITS.reportDescriptionMaximumLength),
}).strict();
export const reviewPropertyReportSchema = z.object({
  status: z.enum([PropertyReportStatus.REVIEWED, PropertyReportStatus.DISMISSED]),
  reason: reasonSchema,
}).strict();
export const createAdminStaffSchema = z.object({
  fullName: z.string().trim().min(AUTH_VALIDATION_LIMITS.fullNameMinimumLength).max(AUTH_VALIDATION_LIMITS.fullNameMaximumLength),
  email: z.string().trim().email().max(AUTH_VALIDATION_LIMITS.emailMaximumLength).transform((value) => value.toLowerCase()),
  password: z.string().min(ADMIN_STAFF_LIMITS.passwordMinimumLength).max(AUTH_VALIDATION_LIMITS.passwordMaximumLength),
  role: z.enum(CREATABLE_ADMIN_USER_ROLES),
}).strict();
export const adminStaffStatusSchema = z.object({ isActive: z.boolean() }).strict();
