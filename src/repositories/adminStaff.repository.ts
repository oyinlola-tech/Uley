import { AdminActionType, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { ChangeAdminStaffStatusDto, CreateAdminStaffDto } from '../dtos/adminManagement.dto.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app.error.js';
import { ADMIN_STAFF_LIMITS, ADMIN_STAFF_ROLE_VALUES } from '../constants/adminStaff.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import { writeSystemLogEntry } from '../utils/systemLog.writer.js';

const staffRoles: UserRole[] = [...ADMIN_STAFF_ROLE_VALUES];

export function listAdminStaff() {
  return prismaDatabaseClient.user.findMany({ where: { role: { in: staffRoles } }, take: ADMIN_STAFF_LIMITS.pageSize, orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true } });
}

export async function createAdminStaff(input: CreateAdminStaffDto) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    if (await transaction.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new ConflictError(ERROR_MESSAGES.duplicateAccount);
    const staff = await transaction.user.create({ data: { email: input.email, fullName: input.fullName, passwordHash: input.password, role: input.role }, select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true } });
    const reason = `Created ${input.role} account.`;
    await transaction.adminAction.create({ data: { actorId: input.actorId, actionType: AdminActionType.ADMIN_STAFF_CREATED, targetType: 'USER', targetId: staff.id, reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.actorId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'USER', targetId: staff.id, summary: 'ADMIN_STAFF_CREATED completed', metadata: { actionType: AdminActionType.ADMIN_STAFF_CREATED, reason } });
    return staff;
  });
}

export async function changeAdminStaffStatus(input: ChangeAdminStaffStatusDto) {
  if (input.actorId === input.userId) throw new ForbiddenError(ERROR_MESSAGES.cannotSuspendYourOwnAccount);
  const staff = await prismaDatabaseClient.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true, isActive: true } });
  if (!staff || !staffRoles.includes(staff.role)) throw new NotFoundError();
  if (staff.role === UserRole.SUPER_ADMIN) throw new ForbiddenError(ERROR_MESSAGES.cannotSuspendSuperAdministrator);
  if (staff.isActive === input.isActive) throw new ConflictError(ERROR_MESSAGES.adminStaffStatusUnchanged);
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.user.updateMany({ where: { id: staff.id, isActive: staff.isActive, role: staff.role }, data: { isActive: input.isActive } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.adminStaffStatusChanged);
    if (!input.isActive) await transaction.authSession.updateMany({ where: { userId: staff.id, revokedAt: null }, data: { revokedAt: new Date() } });
    const actionType = input.isActive ? AdminActionType.ADMIN_STAFF_REACTIVATED : AdminActionType.ADMIN_STAFF_SUSPENDED;
    const reason = input.isActive ? 'Administrator reactivated by super admin.' : 'Administrator suspended by super admin.';
    await transaction.adminAction.create({ data: { actorId: input.actorId, actionType, targetType: 'USER', targetId: staff.id, reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.actorId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'USER', targetId: staff.id, summary: `${actionType} completed`, metadata: { actionType, reason } });
    return transaction.user.findUniqueOrThrow({ where: { id: staff.id }, select: { id: true, fullName: true, email: true, role: true, isActive: true } });
  });
}
