import { InspectionFeedbackOutcome, InspectionRescheduleStatus, InspectionStatus, NotificationType, OccupancyStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { enqueueInspectionReminders, enqueueUserNotification } from './notification.repository.js';

const inspectionDetails = {
  property: { select: { id: true, name: true, neighborhood: true, city: true } },
  unit: { select: { id: true, name: true, rentAmount: true, rentalPeriod: true } },
  student: { select: { id: true, fullName: true, email: true } },
  rescheduleRequests: { orderBy: { createdAt: 'desc' as const }, take: 5 },
  feedback: true,
  occupancy: { include: { review: true } },
  rentalApplication: { select: { id: true, status: true } },
};

export async function requestInspectionReschedule(input: { inspectionId: string; studentId: string; proposedFor: Date; message?: string }) {
  const inspection = await prismaDatabaseClient.inspection.findFirst({
    where: { id: input.inspectionId, studentId: input.studentId, status: { in: [InspectionStatus.CONFIRMED, InspectionStatus.MISSED] } },
    include: { property: { select: { landlordId: true, name: true } }, unit: { select: { name: true } } },
  });
  if (!inspection || await hasPendingReschedule(input.inspectionId)) return null;
  const request = await prismaDatabaseClient.inspectionReschedule.create({ data: { inspectionId: input.inspectionId, requestedById: input.studentId, proposedFor: input.proposedFor, ...(input.message ? { message: input.message } : {}), pendingKey: input.inspectionId + ':pending' }, include: { requestedBy: { select: { fullName: true } } } });
  await enqueueUserNotification({
    recipientId: inspection.property.landlordId, type: NotificationType.INSPECTION_RESCHEDULE_REQUESTED,
    title: 'A student suggested another visit time',
    message: request.requestedBy.fullName + ' requested ' + request.proposedFor.toLocaleString() + ' for ' + inspection.property.name + (input.message ? ' · ' + input.message : '.'),
    href: '/landlord/inspections',
    deduplicationKey: 'inspection-reschedule:' + request.id + ':landlord',
  });
  return request;
}

export async function respondToInspectionReschedule(input: { requestId: string; landlordId: string; decision: InspectionRescheduleStatus; response?: string }) {
  const result = await prismaDatabaseClient.$transaction(async (transaction) => {
    const request = await transaction.inspectionReschedule.findFirst({
      where: { id: input.requestId, status: InspectionRescheduleStatus.PENDING, inspection: { property: { landlordId: input.landlordId } } },
      include: { inspection: { include: { property: { select: { name: true } }, unit: { select: { name: true } } } } },
    });
    if (!request) return null;
    await transaction.inspectionReschedule.update({ where: { id: request.id }, data: { status: input.decision, pendingKey: null, ...(input.response ? { response: input.response } : {}), respondedAt: new Date(), respondedById: input.landlordId } });
    if (input.decision === InspectionRescheduleStatus.ACCEPTED) {
      await transaction.inspection.update({ where: { id: request.inspectionId }, data: { scheduledFor: request.proposedFor, status: InspectionStatus.CONFIRMED, missedAt: null, completedAt: null, respondedAt: new Date() } });
      await transaction.notification.updateMany({ where: { deduplicationKey: { startsWith: 'inspection:' + request.inspectionId + ':reminder:' }, readAt: null, scheduledFor: { gt: new Date() } }, data: { readAt: new Date() } });
      await transaction.notification.createMany({ data: [{
        recipientId: request.inspection.studentId, type: NotificationType.INSPECTION_RESCHEDULED,
        title: 'Your inspection time changed',
        message: request.inspection.property.name + ' · ' + request.inspection.unit.name + ' · ' + request.proposedFor.toLocaleString(),
        href: '/inspections', deduplicationKey: 'inspection-reschedule:' + request.id + ':student', scheduledFor: new Date(),
      }], skipDuplicates: true });
    } else {
      await transaction.notification.createMany({ data: [{
        recipientId: request.inspection.studentId, type: NotificationType.INSPECTION_RESCHEDULE_DECLINED,
        title: 'The new visit time was declined',
        message: input.response ?? 'Contact the landlord to agree on another inspection time.',
        href: '/inspections', deduplicationKey: 'inspection-reschedule:' + request.id + ':declined', scheduledFor: new Date(),
      }], skipDuplicates: true });
    }
    return transaction.inspectionReschedule.findUnique({ where: { id: request.id }, include: { inspection: { include: inspectionDetails } } });
  });
  if (result && input.decision === InspectionRescheduleStatus.ACCEPTED) {
    const inspection = result.inspection;
    await enqueueInspectionReminders({
      inspectionId: inspection.id, scheduledFor: inspection.scheduledFor, studentId: inspection.studentId,
      landlordId: input.landlordId, propertyName: inspection.property.name, unitName: inspection.unit.name,
    });
  }
  return result;
}

export async function markInspectionMissed(input: { inspectionId: string; actorId: string; isLandlord: boolean }) {
  const where = input.isLandlord
    ? { id: input.inspectionId, status: InspectionStatus.CONFIRMED, scheduledFor: { lt: new Date() }, property: { landlordId: input.actorId } }
    : { id: input.inspectionId, status: InspectionStatus.CONFIRMED, scheduledFor: { lt: new Date() }, studentId: input.actorId };
  const changed = await prismaDatabaseClient.inspection.updateMany({ where, data: { status: InspectionStatus.MISSED, missedAt: new Date() } });
  if (!changed.count) return null;
  const inspection = await prismaDatabaseClient.inspection.findUnique({ where: { id: input.inspectionId }, include: { ...inspectionDetails, property: { select: { id: true, name: true, neighborhood: true, city: true, landlordId: true } } } });
  if (!inspection) return null;
  const recipientId = input.isLandlord ? inspection.studentId : inspection.property.landlordId;
  await enqueueUserNotification({
    recipientId, type: NotificationType.INSPECTION_MISSED,
    title: 'Inspection marked as missed',
    message: inspection.property.name + ' · ' + inspection.unit.name + ' · ' + inspection.scheduledFor.toLocaleString(),
    href: '/inspections', deduplicationKey: 'inspection:' + inspection.id + ':missed:' + recipientId,
  });
  return inspection;
}

export async function submitInspectionFeedback(input: { inspectionId: string; studentId: string; outcome: InspectionFeedbackOutcome; comment?: string; moveInDate?: Date; paymentReported: boolean }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const inspection = await transaction.inspection.findFirst({
      where: { id: input.inspectionId, studentId: input.studentId, status: InspectionStatus.CONFIRMED, scheduledFor: { lte: new Date() } },
      include: { property: { select: { landlordId: true, name: true } }, unit: { select: { id: true, name: true } } },
    });
    if (!inspection) return null;
    await transaction.inspectionFeedback.create({ data: { inspectionId: inspection.id, studentId: input.studentId, outcome: input.outcome, ...(input.comment ? { comment: input.comment } : {}) } });
    await transaction.inspection.update({ where: { id: inspection.id }, data: { status: InspectionStatus.COMPLETED, completedAt: new Date() } });
    let occupancy = null;
    if (input.outcome === InspectionFeedbackOutcome.SECURED) {
      occupancy = await transaction.occupancy.create({
        data: {
          inspectionId: inspection.id, studentId: input.studentId, landlordId: inspection.property.landlordId,
          propertyId: inspection.propertyId, unitId: inspection.unit.id, ...(input.moveInDate ? { moveInDate: input.moveInDate } : {}),
          ...(input.paymentReported ? { paymentReportedAt: new Date() } : {}),
        },
      });
      await transaction.notification.createMany({ data: [{
        recipientId: inspection.property.landlordId, type: NotificationType.OCCUPANCY_REQUESTED,
        title: 'Student reported moving into a home',
        message: 'Confirm the move-in for ' + inspection.property.name + ' · ' + inspection.unit.name + ' and record payment confirmation if applicable.',
        href: '/landlord/inspections', deduplicationKey: 'occupancy:' + occupancy.id + ':landlord', scheduledFor: new Date(),
      }], skipDuplicates: true });
    }
    return { feedback: await transaction.inspectionFeedback.findUnique({ where: { inspectionId: inspection.id } }), occupancy };
  });
}

async function hasPendingReschedule(inspectionId: string) {
  return Boolean(await prismaDatabaseClient.inspectionReschedule.findFirst({ where: { inspectionId, status: InspectionRescheduleStatus.PENDING }, select: { id: true } }));
}

export { inspectionDetails };
