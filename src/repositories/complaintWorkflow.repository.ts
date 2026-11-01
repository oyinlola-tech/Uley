import { ComplaintCategory, ComplaintStatus, NotificationType, OccupancyStatus, Prisma, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { COMPLAINT_LIMITS } from '../constants/complaint.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';

const complaintInclude = {
  property: { select: { id: true, name: true, city: true } },
  occupancy: { select: { id: true, status: true } },
  reporter: { select: { id: true, fullName: true } },
  landlord: { select: { id: true, fullName: true } },
  messages: { orderBy: { createdAt: 'asc' as const }, take: 100, include: { sender: { select: { id: true, fullName: true, role: true } } } },
};
const complaintListInclude = {
  ...complaintInclude,
  evidence: { orderBy: { createdAt: 'asc' as const }, take: COMPLAINT_LIMITS.evidenceVideoMaximumCount, select: { id: true, videoStorageKey: true, posterStorageKey: true, fileName: true, sizeBytes: true, durationSeconds: true, createdAt: true } },
  videoScanJobs: { orderBy: { createdAt: 'desc' as const }, take: COMPLAINT_LIMITS.evidenceVideoMaximumCount, select: { uploadId: true, fileName: true, status: true, lastErrorCode: true, createdAt: true } },
};
type ComplaintDataClient = Pick<Prisma.TransactionClient, 'notification' | 'user' | 'systemLog' | 'propertyCaretaker'>;

export async function createOccupancyComplaint(input: { studentId: string; occupancyId: string; category: ComplaintCategory; description: string; isUrgent: boolean }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const occupancy = await transaction.occupancy.findFirst({ where: { id: input.occupancyId, studentId: input.studentId, status: OccupancyStatus.ACTIVE }, select: { id: true, propertyId: true, landlordId: true, property: { select: { name: true } } } });
    if (!occupancy) throw new ConflictError(ERROR_MESSAGES.complaintOccupancyRequired);
    const status = input.isUrgent ? ComplaintStatus.ESCALATED : ComplaintStatus.OPEN;
    const complaint = await transaction.complaint.create({ data: { occupancyId: occupancy.id, propertyId: occupancy.propertyId, reporterId: input.studentId, landlordId: occupancy.landlordId, category: input.category, description: input.description, isUrgent: input.isUrgent, status }, include: complaintInclude });
    await notifyUser(transaction, occupancy.landlordId, complaint.id, 'A student opened a housing complaint', occupancy.property.name);
    await notifyAssignedCaretakers(transaction, occupancy.propertyId, complaint.id, occupancy.property.name);
    if (input.isUrgent) await notifySchool(transaction, complaint.id, occupancy.property.name, 'An urgent housing complaint was sent directly to school support.');
    await logComplaintEvent(transaction, input.studentId, complaint.id, input.isUrgent ? 'URGENT_COMPLAINT_OPENED' : 'COMPLAINT_OPENED');
    return complaint;
  });
}

export async function listMyHousingComplaints(input: { userId: string; role: UserRole; page: number }) {
  const where: Prisma.ComplaintWhereInput = input.role === UserRole.STUDENT ? { reporterId: input.userId }
    : input.role === UserRole.CARETAKER ? { property: { caretakers: { some: { caretakerUserId: input.userId, removedAt: null } } } }
      : { landlordId: input.userId };
  const take = COMPLAINT_LIMITS.pageSize;
  const [complaints, totalCount] = await Promise.all([
    prismaDatabaseClient.complaint.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (input.page - 1) * take, take, include: complaintListInclude }),
    prismaDatabaseClient.complaint.count({ where }),
  ]);
  return { complaints, pagination: { page: input.page, pageSize: take, totalCount, totalPages: Math.ceil(totalCount / take) } };
}

export async function listSchoolHousingComplaints(input: { page: number }) {
  const take = COMPLAINT_LIMITS.pageSize;
  const where = { status: { not: ComplaintStatus.CLOSED } };
  const [complaints, totalCount] = await Promise.all([
    prismaDatabaseClient.complaint.findMany({ where, orderBy: [{ isUrgent: 'desc' }, { status: 'asc' }, { createdAt: 'asc' }], skip: (input.page - 1) * take, take, include: { ...complaintListInclude, reviewer: { select: { id: true, fullName: true } } } }),
    prismaDatabaseClient.complaint.count({ where }),
  ]);
  return { complaints, pagination: { page: input.page, pageSize: take, totalCount, totalPages: Math.ceil(totalCount / take) } };
}

export async function assertComplaintVideoUploadAllowed(complaintId: string, studentId: string) {
  const complaint = await prismaDatabaseClient.complaint.findFirst({
    where: { id: complaintId, reporterId: studentId, status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } },
    select: { id: true, _count: { select: { evidence: true } } },
  });
  if (!complaint) throw new NotFoundError(ERROR_MESSAGES.complaintVideoUploadNotAllowed);
  if (complaint._count.evidence >= COMPLAINT_LIMITS.evidenceVideoMaximumCount) throw new ConflictError(ERROR_MESSAGES.complaintVideoLimitReached);
}

export async function saveComplaintVideoEvidence(input: {
  complaintId: string; studentId: string; videoStorageKey: string; posterStorageKey: string;
  fileName: string; sha256: string; sizeBytes: number; durationSeconds: number;
}) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({
      where: { id: input.complaintId, reporterId: input.studentId, status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } },
      select: { id: true, _count: { select: { evidence: true } } },
    });
    if (!complaint) throw new NotFoundError(ERROR_MESSAGES.complaintVideoUploadNotAllowed);
    if (complaint._count.evidence >= COMPLAINT_LIMITS.evidenceVideoMaximumCount) throw new ConflictError(ERROR_MESSAGES.complaintVideoLimitReached);
    return transaction.complaintEvidence.create({
      data: { complaintId: input.complaintId, uploaderId: input.studentId, videoStorageKey: input.videoStorageKey, posterStorageKey: input.posterStorageKey, fileName: input.fileName, sha256: input.sha256, sizeBytes: input.sizeBytes, durationSeconds: input.durationSeconds },
      select: { id: true, videoStorageKey: true, posterStorageKey: true, fileName: true, sizeBytes: true, durationSeconds: true, createdAt: true },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateHousingComplaintStatus(input: { complaintId: string; actorId: string; actorRole: UserRole; status: ComplaintStatus; note?: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({ where: { id: input.complaintId, ...(input.actorRole === UserRole.LANDLORD ? { landlordId: input.actorId } : input.actorRole === UserRole.CARETAKER ? { property: { caretakers: { some: { caretakerUserId: input.actorId, removedAt: null } } } } : {}) } });
    if (!complaint || includesStatus(complaint.status, [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED])) throw new NotFoundError(ERROR_MESSAGES.complaintUnavailable);
    const landlordAllowed = includesStatus(input.status, [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]);
    const adminAllowed = includesStatus(input.status, [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]);
    if (isHousingProvider(input.actorRole) ? !landlordAllowed : !adminAllowed) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    if (!isComplaintTransitionAllowed(complaint.status, input.status, input.actorRole)) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    if (input.status === ComplaintStatus.RESOLVED && (input.note?.trim().length ?? 0) < COMPLAINT_LIMITS.resolutionMinimumLength) throw new ConflictError(ERROR_MESSAGES.complaintResolutionRequired);
    if (input.status === ComplaintStatus.REJECTED && (input.note?.trim().length ?? 0) < COMPLAINT_LIMITS.resolutionMinimumLength) throw new ConflictError(ERROR_MESSAGES.complaintResolutionRequired);
    const changed = await transaction.complaint.updateMany({ where: { id: complaint.id, status: complaint.status }, data: { status: input.status, ...(input.status === ComplaintStatus.RESOLVED ? { resolutionSummary: input.note, resolvedAt: new Date() } : {}), ...(!isHousingProvider(input.actorRole) ? { reviewerId: input.actorId, reviewedAt: new Date() } : {}) } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    if (input.note) await transaction.complaintMessage.create({ data: { complaintId: complaint.id, senderId: input.actorId, body: input.note } });
    await notifyUser(transaction, complaint.reporterId, complaint.id, 'Your housing complaint was updated', input.note ?? 'Open your complaint for the latest status.');
    await logComplaintEvent(transaction, input.actorId, complaint.id, 'COMPLAINT_STATUS_CHANGED', input.requestId, { from: complaint.status, to: input.status });
    return transaction.complaint.findUniqueOrThrow({ where: { id: complaint.id }, include: complaintInclude });
  });
}

export async function confirmHousingComplaintResolution(input: { complaintId: string; studentId: string; resolved: boolean; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({ where: { id: input.complaintId, reporterId: input.studentId, status: ComplaintStatus.RESOLVED }, include: { property: { select: { name: true } } } });
    if (!complaint) throw new ConflictError(ERROR_MESSAGES.complaintCanOnlyCloseAfterResolution);
    const status = input.resolved ? ComplaintStatus.CLOSED : ComplaintStatus.ESCALATED;
    const changed = await transaction.complaint.updateMany({ where: { id: complaint.id, status: ComplaintStatus.RESOLVED }, data: { status, ...(input.resolved ? { closedAt: new Date() } : { isUrgent: true }) } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    if (input.resolved) await notifyUser(transaction, complaint.landlordId, complaint.id, 'The student confirmed the housing issue was resolved', complaint.property.name);
    else await notifySchool(transaction, complaint.id, complaint.property.name, 'A student says the proposed resolution did not resolve the complaint.');
    await logComplaintEvent(transaction, input.studentId, complaint.id, input.resolved ? 'COMPLAINT_CLOSED_BY_STUDENT' : 'COMPLAINT_REOPENED_TO_SCHOOL', input.requestId);
    return transaction.complaint.findUniqueOrThrow({ where: { id: complaint.id }, include: complaintInclude });
  });
}

export async function escalateHousingComplaint(input: { complaintId: string; studentId: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({ where: { id: input.complaintId, reporterId: input.studentId, status: { in: [ComplaintStatus.OPEN, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS] } }, include: { property: { select: { name: true } } } });
    if (!complaint) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    const changed = await transaction.complaint.updateMany({ where: { id: complaint.id, reporterId: input.studentId, status: { in: [ComplaintStatus.OPEN, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS] } }, data: { status: ComplaintStatus.ESCALATED, isUrgent: true } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.complaintUnavailable);
    await notifySchool(transaction, complaint.id, complaint.property.name, 'A student escalated an unresolved housing complaint to school support.');
    await notifyUser(transaction, complaint.landlordId, complaint.id, 'A housing complaint was escalated to school support', 'You may continue to provide updates in the complaint thread.');
    await logComplaintEvent(transaction, input.studentId, complaint.id, 'COMPLAINT_ESCALATED', input.requestId);
    return transaction.complaint.findUniqueOrThrow({ where: { id: complaint.id }, include: complaintInclude });
  });
}

export async function addHousingComplaintMessage(input: { complaintId: string; senderId: string; senderRole: UserRole; body: string }) {
  const isSchoolReviewer = includesRole(input.senderRole, [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.SAFETY_ADMIN]);
  const where: Prisma.ComplaintWhereInput = { id: input.complaintId, ...(!isSchoolReviewer ? { OR: [{ reporterId: input.senderId }, { landlordId: input.senderId }, ...(input.senderRole === UserRole.CARETAKER ? [{ property: { caretakers: { some: { caretakerUserId: input.senderId, removedAt: null } } } }] : [])] } : {}) };
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({ where, select: { id: true, reporterId: true, landlordId: true, propertyId: true, status: true } });
    if (!complaint || includesStatus(complaint.status, [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED])) throw new NotFoundError(ERROR_MESSAGES.complaintUnavailable);
    const message = await transaction.complaintMessage.create({ data: { complaintId: complaint.id, senderId: input.senderId, body: input.body }, include: { sender: { select: { id: true, fullName: true, role: true } } } });
    const recipients = input.senderId === complaint.reporterId ? [complaint.landlordId] : [complaint.reporterId, complaint.landlordId];
    await Promise.all(recipients.map((recipientId) => notifyUser(transaction, recipientId, complaint.id, 'New message on a housing complaint', message.sender.fullName + ' sent an update.')));
    if (input.senderId === complaint.reporterId) await notifyAssignedCaretakers(transaction, complaint.propertyId, complaint.id, 'A resident added a housing complaint update.');
    return message;
  });
}

async function notifyUser(client: ComplaintDataClient, recipientId: string, complaintId: string, title: string, message: string) {
  await client.notification.createMany({ data: [{ recipientId, type: NotificationType.COMPLAINT_UPDATED, title, message, href: '/complaints', deduplicationKey: 'complaint:' + complaintId + ':update:' + Date.now(), scheduledFor: new Date() }], skipDuplicates: true });
}
async function notifySchool(client: ComplaintDataClient, complaintId: string, propertyName: string, message: string) {
  const admins = await client.user.findMany({ where: { isActive: true, role: { in: [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.SAFETY_ADMIN] } }, select: { id: true } });
  if (admins.length) await client.notification.createMany({ data: admins.map(({ id }) => ({ recipientId: id, type: NotificationType.COMPLAINT_ESCALATED, title: 'Housing complaint needs school review', message: propertyName + ' · ' + message, href: '/admin/complaints', deduplicationKey: 'complaint:' + complaintId + ':school:' + id, scheduledFor: new Date() })), skipDuplicates: true });
}
async function logComplaintEvent(client: ComplaintDataClient, actorId: string, complaintId: string, event: string, requestId?: string, details?: Prisma.InputJsonObject) {
  await client.systemLog.create({ data: { eventType: 'COMPLAINT_EVENT', level: 'INFO', actorId, ...(requestId ? { requestId } : {}), targetType: 'COMPLAINT', targetId: complaintId, summary: 'A housing complaint workflow action occurred.', metadata: { event, ...(details ?? {}) } } });
}
function isComplaintTransitionAllowed(current: ComplaintStatus, next: ComplaintStatus, role: UserRole): boolean {
  if (isHousingProvider(role)) {
    if (current === ComplaintStatus.OPEN) return includesStatus(next, [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]);
    if (current === ComplaintStatus.ACKNOWLEDGED) return includesStatus(next, [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]);
    if (current === ComplaintStatus.IN_PROGRESS) return includesStatus(next, [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]);
    return current === ComplaintStatus.ESCALATED && next === ComplaintStatus.RESOLVED;
  }
  if (includesStatus(current, [ComplaintStatus.OPEN, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ESCALATED])) return includesStatus(next, [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]);
  return false;
}
function isHousingProvider(role: UserRole) { return role === UserRole.LANDLORD || role === UserRole.CARETAKER; }
async function notifyAssignedCaretakers(client: ComplaintDataClient, propertyId: string, complaintId: string, propertyName: string) {
  const assignments = await client.propertyCaretaker.findMany({ where: { propertyId, removedAt: null }, select: { caretakerUserId: true } });
  if (!assignments.length) return;
  await client.notification.createMany({ data: assignments.map(({ caretakerUserId }) => ({ recipientId: caretakerUserId, type: NotificationType.COMPLAINT_OPENED, title: 'A resident reported a housing issue', message: propertyName, href: '/caretaker/complaints', deduplicationKey: `complaint:${complaintId}:caretaker:${caretakerUserId}`, scheduledFor: new Date() })), skipDuplicates: true });
}
function includesStatus(status: ComplaintStatus, allowed: readonly ComplaintStatus[]) { return allowed.includes(status); }
function includesRole(role: UserRole, allowed: readonly UserRole[]) { return allowed.includes(role); }
