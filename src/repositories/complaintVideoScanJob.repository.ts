import { ComplaintStatus, Prisma, PropertyImageScanStatus, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { COMPLAINT_LIMITS } from '../constants/complaint.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';

const activeStatuses = [PropertyImageScanStatus.QUEUED, PropertyImageScanStatus.PROCESSING, PropertyImageScanStatus.RETRYING];

export async function createComplaintVideoScanJob(input: { uploadId: string; complaintId: string; studentId: string; fileName: string; contentType: string; sourceBytes: Buffer }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const complaint = await transaction.complaint.findFirst({
      where: { id: input.complaintId, reporterId: input.studentId, status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } },
      select: { id: true, _count: { select: { evidence: true } } },
    });
    if (!complaint) throw new NotFoundError(ERROR_MESSAGES.complaintVideoUploadNotAllowed);
    const activeCount = await transaction.complaintVideoScanJob.count({ where: { complaintId: complaint.id, status: { in: activeStatuses } } });
    if (complaint._count.evidence + activeCount >= COMPLAINT_LIMITS.evidenceVideoMaximumCount) throw new ConflictError(ERROR_MESSAGES.complaintVideoLimitReached);
    return transaction.complaintVideoScanJob.create({ data: { ...input, uploaderId: input.studentId, sourceBytes: new Uint8Array(input.sourceBytes) }, select: { uploadId: true, status: true, createdAt: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getComplaintVideoScanStatus(uploadId: string, complaintId: string, actorId: string, actorRole: UserRole) {
  const job = await prismaDatabaseClient.complaintVideoScanJob.findFirst({
    where: { uploadId, complaintId, complaint: { OR: [{ reporterId: actorId }, { landlordId: actorId }, ...(actorRole === UserRole.CARETAKER ? [{ property: { caretakers: { some: { caretakerUserId: actorId, removedAt: null } } } }] : []), ...(actorRole !== UserRole.STUDENT && actorRole !== UserRole.LANDLORD && actorRole !== UserRole.CARETAKER ? [{}] : [])] } },
    select: { uploadId: true, status: true, lastErrorCode: true, createdAt: true, evidence: { select: { id: true, fileName: true, sizeBytes: true, durationSeconds: true, videoStorageKey: true, posterStorageKey: true, createdAt: true } } },
  });
  if (!job) throw new NotFoundError();
  return job;
}

export async function claimComplaintVideoScanJob(now: Date, leaseUntil: Date) {
  const candidate = await prismaDatabaseClient.complaintVideoScanJob.findFirst({ where: { OR: [
    { status: { in: [PropertyImageScanStatus.QUEUED, PropertyImageScanStatus.RETRYING] }, nextAttemptAt: { lte: now } },
    { status: PropertyImageScanStatus.PROCESSING, leaseExpiresAt: { lte: now } },
  ] }, orderBy: { createdAt: 'asc' } });
  if (!candidate) return null;
  const claimed = await prismaDatabaseClient.complaintVideoScanJob.updateMany({ where: { id: candidate.id, status: candidate.status, updatedAt: candidate.updatedAt }, data: { status: PropertyImageScanStatus.PROCESSING, attempts: { increment: 1 }, leaseExpiresAt: leaseUntil, lastErrorCode: null } });
  return claimed.count ? prismaDatabaseClient.complaintVideoScanJob.findUnique({ where: { id: candidate.id } }) : null;
}

export async function completeComplaintVideoScanJob(jobId: string, evidence: { complaintId: string; uploaderId: string; videoStorageKey: string; posterStorageKey: string; fileName: string; sha256: string; sizeBytes: number; durationSeconds: number }) {
  await prismaDatabaseClient.$transaction(async (transaction) => {
    const saved = await transaction.complaintEvidence.create({ data: evidence });
    await transaction.complaintVideoScanJob.update({ where: { id: jobId }, data: { status: PropertyImageScanStatus.COMPLETED, sourceBytes: null, evidenceId: saved.id, leaseExpiresAt: null } });
  });
}

export async function updateComplaintVideoScanFailure(jobId: string, status: PropertyImageScanStatus, nextAttemptAt: Date | null, errorCode: string) {
  await prismaDatabaseClient.complaintVideoScanJob.update({ where: { id: jobId }, data: { status, ...(nextAttemptAt ? { nextAttemptAt } : { sourceBytes: null }), leaseExpiresAt: null, lastErrorCode: errorCode } });
}
