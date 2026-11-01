import { AdminActionType as PrismaAdminActionType, InspectionStatus, PropertyReportStatus as PrismaReportStatus, PropertyStatus, UserRole, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { ChangeAccountStatusDto, ChangePropertyStatusDto, ReviewPropertyReportDto, SubmitPropertyReportDto } from '../dtos/adminManagement.dto.js';
import { AdminActionType } from '../enums/adminActionType.enum.js';
import { PropertyReportStatus } from '../enums/propertyReportStatus.enum.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ADMIN_DASHBOARD_LIMITS } from '../constants/adminDashboard.constant.js';
import { ADMIN_STAFF_ROLE_VALUES } from '../constants/adminStaff.constant.js';
import { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import { writeSystemLogEntry } from '../utils/systemLog.writer.js';

export async function getAdminDashboardOverview() {
  const [students, landlords, publishedProperties, suspendedProperties, pendingLandlords, pendingProperties, pendingInspections, openReports, recentActions] = await Promise.all([
    prismaDatabaseClient.user.count({ where: { role: UserRole.STUDENT, isActive: true } }),
    prismaDatabaseClient.user.count({ where: { role: UserRole.LANDLORD, isActive: true } }),
    prismaDatabaseClient.property.count({ where: { status: PropertyStatus.PUBLISHED } }),
    prismaDatabaseClient.property.count({ where: { status: PropertyStatus.SUSPENDED } }),
    prismaDatabaseClient.landlordVerification.count({ where: { status: VerificationStatus.PENDING } }),
    prismaDatabaseClient.propertyVerification.count({ where: { status: VerificationStatus.PENDING } }),
    prismaDatabaseClient.inspection.count({ where: { status: InspectionStatus.REQUESTED } }),
    prismaDatabaseClient.propertyReport.count({ where: { status: PrismaReportStatus.OPEN } }),
    prismaDatabaseClient.adminAction.findMany({ take: ADMIN_DASHBOARD_LIMITS.recentActions, orderBy: { createdAt: 'desc' }, include: { actor: { select: { fullName: true } } } }),
  ]);
  return { metrics: { students, landlords, publishedProperties, suspendedProperties, pendingLandlords, pendingProperties, pendingInspections, openReports }, recentActions };
}

export async function listAdminAccounts() {
  return prismaDatabaseClient.user.findMany({ where: { role: { in: [UserRole.STUDENT, UserRole.LANDLORD, UserRole.CARETAKER] } }, take: ADMIN_DASHBOARD_LIMITS.accountRecordsPerPage, orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true } });
}

export async function listAdminProperties() {
  return prismaDatabaseClient.property.findMany({ take: ADMIN_DASHBOARD_LIMITS.propertyRecordsPerPage, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, city: true, status: true, updatedAt: true, landlord: { select: { id: true, fullName: true, email: true, isActive: true } }, verification: { select: { status: true } }, units: { select: { id: true, name: true, isAvailable: true, rentAmount: true, rentalPeriod: true } } } });
}

export async function listOpenPropertyReports() {
  return prismaDatabaseClient.propertyReport.findMany({ where: { status: PrismaReportStatus.OPEN }, orderBy: { createdAt: 'asc' }, take: ADMIN_DASHBOARD_LIMITS.reportRecordsPerPage, include: { property: { select: { name: true, city: true, status: true } }, reporter: { select: { fullName: true, email: true } } } });
}

export async function listAdminInspectionRequests() {
  return prismaDatabaseClient.inspection.findMany({
    take: ADMIN_DASHBOARD_LIMITS.inspectionRecordsPerPage,
    orderBy: [{ status: 'asc' }, { scheduledFor: 'asc' }],
    include: {
      student: { select: { fullName: true, email: true } },
      property: { select: { name: true, city: true, landlord: { select: { fullName: true } } } },
      unit: { select: { name: true, rentAmount: true, rentalPeriod: true } },
    },
  });
}

export async function changeAccountActiveStatus(input: ChangeAccountStatusDto) {
  if (input.userId === input.adminId) throw new ForbiddenError(ERROR_MESSAGES.cannotSuspendYourOwnAccount);
  const account = await prismaDatabaseClient.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true, isActive: true } });
  if (!account) throw new NotFoundError();
  const protectedAdminRoles: UserRole[] = [...ADMIN_STAFF_ROLE_VALUES];
  if (protectedAdminRoles.includes(account.role)) throw new ForbiddenError(ERROR_MESSAGES.accountCannotBeSuspended);
  if (account.isActive === input.isActive) throw new ConflictError(ERROR_MESSAGES.conflict);
  const actionType = input.isActive ? AdminActionType.ACCOUNT_REACTIVATED : AdminActionType.ACCOUNT_SUSPENDED;
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.user.updateMany({ where: { id: input.userId, isActive: account.isActive, role: { notIn: protectedAdminRoles } }, data: { isActive: input.isActive } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.conflict);
    if (!input.isActive) await transaction.authSession.updateMany({ where: { userId: input.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    const prismaActionType = toPrismaAction(actionType);
    await transaction.adminAction.create({ data: { actorId: input.adminId, actionType: prismaActionType, targetType: 'USER', targetId: input.userId, reason: input.reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.adminId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'USER', targetId: input.userId, summary: `${actionType} completed`, metadata: { actionType, reason: input.reason } });
    return transaction.user.findUniqueOrThrow({ where: { id: input.userId }, select: { id: true, fullName: true, email: true, role: true, isActive: true } });
  });
}

export async function changePropertyListingStatus(input: ChangePropertyStatusDto) {
  const property = await prismaDatabaseClient.property.findUnique({ where: { id: input.propertyId }, include: { verification: true, units: { select: { isAvailable: true } }, landlord: { include: { landlordVerification: true } } } });
  if (!property) throw new NotFoundError();
  const status = input.action === 'SUSPEND' ? PropertyStatus.SUSPENDED : PropertyStatus.PUBLISHED;
  if (input.action === 'RESTORE' && (property.status !== PropertyStatus.SUSPENDED || property.verification?.status !== VerificationStatus.APPROVED || property.landlord.landlordVerification?.status !== VerificationStatus.APPROVED || !property.landlord.isActive || !property.units.some((unit) => unit.isAvailable))) throw new ConflictError(ERROR_MESSAGES.propertyCannotBeRestored);
  if (input.action === 'SUSPEND' && property.status !== PropertyStatus.PUBLISHED) throw new ConflictError(ERROR_MESSAGES.conflict);
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.property.updateMany({ where: { id: property.id, status: property.status }, data: { status } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.conflict);
    const actionType = input.action === 'SUSPEND' ? PrismaAdminActionType.PROPERTY_SUSPENDED : PrismaAdminActionType.PROPERTY_RESTORED;
    await transaction.adminAction.create({ data: { actorId: input.adminId, actionType, targetType: 'PROPERTY', targetId: property.id, reason: input.reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.adminId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'PROPERTY', targetId: property.id, summary: `${actionType} completed`, metadata: { actionType, reason: input.reason } });
    return transaction.property.findUniqueOrThrow({ where: { id: property.id }, select: { id: true, name: true, status: true } });
  });
}

export async function submitPropertyReport(input: SubmitPropertyReportDto) {
  const propertyExists = await prismaDatabaseClient.property.findFirst({ where: { id: input.propertyId, status: PropertyStatus.PUBLISHED }, select: { id: true } });
  if (!propertyExists) throw new NotFoundError();
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const report = await transaction.propertyReport.create({ data: { reporterId: input.reporterId, propertyId: input.propertyId, category: input.category, description: input.description } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.PROPERTY_REPORT_SUBMITTED, actorId: input.reporterId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'PROPERTY_REPORT', targetId: report.id, summary: 'A student submitted a property report.' });
    return report;
  });
}

export async function reviewPropertyReport(input: ReviewPropertyReportDto) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.propertyReport.updateMany({ where: { id: input.reportId, status: PrismaReportStatus.OPEN }, data: { status: input.status, reviewNote: input.reason, reviewedById: input.adminId, reviewedAt: new Date() } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.reportAlreadyReviewed);
    const actionType = input.status === PropertyReportStatus.REVIEWED ? PrismaAdminActionType.REPORT_REVIEWED : PrismaAdminActionType.REPORT_DISMISSED;
    await transaction.adminAction.create({ data: { actorId: input.adminId, actionType, targetType: 'REPORT', targetId: input.reportId, reason: input.reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: input.status === PropertyReportStatus.REVIEWED ? SystemLogEventType.PROPERTY_REPORT_REVIEWED : SystemLogEventType.PROPERTY_REPORT_DISMISSED, actorId: input.adminId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'PROPERTY_REPORT', targetId: input.reportId, summary: input.status === PropertyReportStatus.REVIEWED ? 'A property report was reviewed.' : 'A property report was dismissed.', metadata: { reason: input.reason } });
    return transaction.propertyReport.findUniqueOrThrow({ where: { id: input.reportId }, include: { property: { select: { name: true } } } });
  });
}

function toPrismaAction(action: AdminActionType) {
  return action === AdminActionType.ACCOUNT_SUSPENDED ? PrismaAdminActionType.ACCOUNT_SUSPENDED : PrismaAdminActionType.ACCOUNT_REACTIVATED;
}
