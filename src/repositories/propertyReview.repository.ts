import { NotificationType, OccupancyStatus, PropertyReviewStatus, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import { writeSystemLogEntry } from '../utils/systemLog.writer.js';

export async function createEligiblePropertyReview(input: { occupancyId: string; studentId: string; rating: number; comment: string }) {
  const occupancy = await prismaDatabaseClient.occupancy.findFirst({
    where: { id: input.occupancyId, studentId: input.studentId, status: OccupancyStatus.ACTIVE, paymentConfirmedAt: { not: null } },
    select: { propertyId: true },
  });
  if (!occupancy) throw new ConflictError(ERROR_MESSAGES.propertyReviewRequiresConfirmedOccupancy);
  const existing = await prismaDatabaseClient.propertyReview.findUnique({ where: { occupancyId: input.occupancyId }, select: { id: true } });
  if (existing) throw new ConflictError(ERROR_MESSAGES.propertyReviewAlreadyExists);
  const review = await prismaDatabaseClient.propertyReview.create({ data: { ...input, propertyId: occupancy.propertyId } });
  const moderators = await prismaDatabaseClient.user.findMany({
    where: { isActive: true, role: { in: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.VERIFICATION_ADMIN] } },
    select: { id: true },
  });
  if (moderators.length) await prismaDatabaseClient.notification.createMany({ data: moderators.map(({ id }) => ({
    recipientId: id, type: NotificationType.PROPERTY_REVIEW_DECISION, title: 'A home review needs moderation',
    message: 'A student submitted an occupancy-backed review for school review.',
    href: '/admin/home-reviews', deduplicationKey: 'property-review:' + review.id + ':moderator:' + id, scheduledFor: new Date(),
  })), skipDuplicates: true });
  return review;
}

export function findPendingPropertyReviews() {
  return prismaDatabaseClient.propertyReview.findMany({
    where: { status: PropertyReviewStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: { property: { select: { id: true, name: true, city: true } }, student: { select: { fullName: true } }, occupancy: { select: { moveInDate: true, paymentConfirmedAt: true } } },
  });
}

export async function reviewPropertyReview(input: { reviewId: string; reviewerId: string; decision: PropertyReviewStatus; reviewNote?: string; requestId?: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.propertyReview.updateMany({
      where: { id: input.reviewId, status: PropertyReviewStatus.PENDING },
      data: { status: input.decision, ...(input.reviewNote ? { reviewNote: input.reviewNote } : {}), reviewedById: input.reviewerId, reviewedAt: new Date() },
    });
    if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.propertyReviewNotFound);
    const review = await transaction.propertyReview.findUnique({ where: { id: input.reviewId } });
    if (!review) throw new NotFoundError(ERROR_MESSAGES.propertyReviewNotFound);
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.reviewerId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'PROPERTY_REVIEW', targetId: review.id, summary: 'A verified home review received a moderation decision.', metadata: { decision: input.decision, ...(input.reviewNote ? { note: input.reviewNote } : {}) } });
    await transaction.notification.createMany({ data: [{
      recipientId: review.studentId, type: NotificationType.PROPERTY_REVIEW_DECISION,
      title: input.decision === PropertyReviewStatus.APPROVED ? 'Your home review is published' : 'Your home review was not approved',
      message: input.reviewNote ?? 'Your review was reviewed by the school.',
      href: '/listings', deduplicationKey: 'property-review:' + review.id + ':decision', scheduledFor: new Date(),
    }], skipDuplicates: true });
    return review;
  });
}

export function findPublicPropertyReviews(propertyId: string) {
  return prismaDatabaseClient.propertyReview.findMany({
    where: { propertyId, status: PropertyReviewStatus.APPROVED },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, rating: true, comment: true, createdAt: true },
  });
}
