import { ContentReportStatus, FlatmatePostStatus, MessageModerationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

type ReportInput = { reporterId: string; messageId?: string; flatmatePostId?: string; userAdvertisementId?: string; reason: string; details?: string };

export async function submitContentReport(input: ReportInput) {
  if (input.messageId) await validateReportedMessage(input.messageId, input.reporterId);
  if (input.flatmatePostId && !(await prismaDatabaseClient.flatmatePost.findUnique({ where: { id: input.flatmatePostId }, select: { id: true } }))) throw new NotFoundError(ERROR_MESSAGES.flatmatePostUnavailable);
  if (input.userAdvertisementId) await validateReportedAdvertisement(input.userAdvertisementId, input.reporterId);
  const target = input.messageId ? { messageId: input.messageId } : input.flatmatePostId ? { flatmatePostId: input.flatmatePostId } : input.userAdvertisementId ? { userAdvertisementId: input.userAdvertisementId } : null;
  if (!target) throw new ValidationError();
  const existing = await prismaDatabaseClient.contentReport.findFirst({ where: { reporterId: input.reporterId, ...target, reason: input.reason as never } });
  if (existing) return existing;
  return prismaDatabaseClient.contentReport.create({ data: { reporterId: input.reporterId, ...target, reason: input.reason as never, ...(input.details ? { details: input.details } : {}) } });
}

async function validateReportedMessage(messageId: string, reporterId: string) {
  const message = await prismaDatabaseClient.conversationMessage.findFirst({ where: { id: messageId, conversation: { participants: { some: { userId: reporterId } } } }, select: { senderId: true } });
  if (!message) throw new NotFoundError(ERROR_MESSAGES.conversationUnavailable);
  if (message.senderId === reporterId) throw new ForbiddenError(ERROR_MESSAGES.conversationUnavailable);
}

async function validateReportedAdvertisement(advertisementId: string, reporterId: string) {
  const ad = await prismaDatabaseClient.userAdvertisement.findFirst({ where: { id: advertisementId, status: { in: ['APPROVED', 'PAUSED'] }, paymentConfirmedAt: { not: null } }, select: { advertiserId: true } });
  if (!ad) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
  if (ad.advertiserId === reporterId) throw new ForbiddenError(ERROR_MESSAGES.conversationUnavailable);
}

export async function listPendingContentReports() {
  const reports = await prismaDatabaseClient.contentReport.findMany({ where: { status: { in: [ContentReportStatus.OPEN, ContentReportStatus.REVIEWING] } }, take: 100, orderBy: { createdAt: 'asc' }, include: { reporter: { select: { fullName: true, email: true } } } });
  return Promise.all(reports.map(async (report) => ({ ...report,
    message: report.messageId ? await prismaDatabaseClient.conversationMessage.findUnique({ where: { id: report.messageId }, select: { body: true, sender: { select: { fullName: true } } } }) : null,
    flatmatePost: report.flatmatePostId ? await prismaDatabaseClient.flatmatePost.findUnique({ where: { id: report.flatmatePostId }, select: { description: true, city: true, student: { select: { fullName: true } } } }) : null,
    advertisement: report.userAdvertisementId ? await prismaDatabaseClient.userAdvertisement.findUnique({ where: { id: report.userAdvertisementId }, select: { id: true, title: true, description: true, city: true, imageStorageKey: true, advertiser: { select: { fullName: true } } } }) : null,
  })));
}

export async function reviewReportedContent(input: { reportId: string; reviewerId: string; status: ContentReportStatus; reviewNote: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const report = await transaction.contentReport.findUnique({ where: { id: input.reportId } });
    if (!report || (report.status !== ContentReportStatus.OPEN && report.status !== ContentReportStatus.REVIEWING)) throw new NotFoundError(ERROR_MESSAGES.flatmatePostUnavailable);
    await transaction.contentReport.update({ where: { id: report.id }, data: { status: input.status, reviewerId: input.reviewerId, reviewNote: input.reviewNote, reviewedAt: new Date() } });
    if (input.status === ContentReportStatus.ACTIONED && report.messageId) await transaction.conversationMessage.updateMany({ where: { id: report.messageId }, data: { moderationStatus: MessageModerationStatus.REJECTED, moderationReason: 'REVIEWED_USER_REPORT' } });
    if (input.status === ContentReportStatus.ACTIONED && report.flatmatePostId) await transaction.flatmatePost.updateMany({ where: { id: report.flatmatePostId }, data: { status: FlatmatePostStatus.REMOVED } });
    if (input.status === ContentReportStatus.ACTIONED && report.userAdvertisementId) {
      const ad = await transaction.userAdvertisement.update({ where: { id: report.userAdvertisementId }, data: { status: 'REJECTED', decisionNote: input.reviewNote, reviewedById: input.reviewerId, reviewedAt: new Date() }, select: { advertiserId: true } });
      await transaction.notification.create({ data: { recipientId: ad.advertiserId, type: 'SPONSORED_CAMPAIGN_UPDATE', title: 'Your ad was removed', message: 'A school moderator reviewed a report about your ad. Check Ads Manager for the review note.', href: '/ads', deduplicationKey: `user-ad:${report.userAdvertisementId}:reported`, scheduledFor: new Date() } });
    }
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'CONTENT_REPORT', targetId: report.id, summary: 'A user content report received a moderation decision.', metadata: { decision: input.status, note: input.reviewNote } } });
    return transaction.contentReport.findUniqueOrThrow({ where: { id: report.id } });
  });
}
