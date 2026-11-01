import { NotificationType, OccupancyStatus, RentalApplicationStatus, SystemLogEventType } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ConflictError } from '../errors/app.error.js';

const occupancyDetails = {
  student: { select: { id: true, fullName: true, email: true } },
  property: { select: { id: true, name: true, neighborhood: true, city: true } },
  unit: { select: { id: true, name: true, rentAmount: true, rentalPeriod: true, isAvailable: true } },
  inspection: { select: { id: true, scheduledFor: true } },
  review: true,
};

export function findStudentOccupancies(studentId: string) {
  return prismaDatabaseClient.occupancy.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, include: occupancyDetails });
}

export function findLandlordOccupancies(landlordId: string) {
  return prismaDatabaseClient.occupancy.findMany({ where: { landlordId }, orderBy: { createdAt: 'desc' }, include: occupancyDetails });
}

export async function respondToOccupancy(input: { occupancyId: string; landlordId: string; decision: 'CONFIRMED' | 'DECLINED'; paymentConfirmed: boolean; paymentAmount?: number }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const occupancy = await transaction.occupancy.findFirst({ where: { id: input.occupancyId, landlordId: input.landlordId, status: OccupancyStatus.REQUESTED } });
    if (!occupancy) return null;
    if (input.decision === 'CONFIRMED') {
      const competingOccupancy = await transaction.occupancy.findFirst({ where: { unitId: occupancy.unitId, id: { not: occupancy.id }, status: { in: [OccupancyStatus.ACTIVE, OccupancyStatus.REQUESTED] } } });
      if (competingOccupancy) throw new ConflictError(ERROR_MESSAGES.occupancyUnitAlreadyOccupied);
    }
    const confirmed = input.decision === 'CONFIRMED';
    await transaction.occupancy.update({
      where: { id: occupancy.id },
      data: {
        status: confirmed ? OccupancyStatus.ACTIVE : OccupancyStatus.DECLINED,
        confirmedAt: confirmed ? new Date() : null,
        paymentConfirmedAt: confirmed && input.paymentConfirmed ? new Date() : null,
        paymentConfirmedById: confirmed && input.paymentConfirmed ? input.landlordId : null,
        paymentAmount: confirmed && input.paymentConfirmed ? input.paymentAmount! : null,
      },
    });
    if (confirmed) await transaction.propertyUnit.update({ where: { id: occupancy.unitId }, data: { isAvailable: false } });
    if (!confirmed) {
      const declinedApplication = await transaction.rentalApplication.updateMany({ where: { inspectionId: occupancy.inspectionId, status: RentalApplicationStatus.APPROVED }, data: { status: RentalApplicationStatus.DECLINED, reviewedAt: new Date() } });
      if (declinedApplication.count) {
        const reservation = await transaction.occupancy.findFirst({ where: { unitId: occupancy.unitId, id: { not: occupancy.id }, status: { in: [OccupancyStatus.ACTIVE, OccupancyStatus.REQUESTED] } }, select: { id: true } });
        if (!reservation) await transaction.propertyUnit.update({ where: { id: occupancy.unitId }, data: { isAvailable: true } });
      }
    }
    await transaction.notification.createMany({ data: [{
      recipientId: occupancy.studentId, type: confirmed ? NotificationType.OCCUPANCY_CONFIRMED : NotificationType.OCCUPANCY_REQUESTED,
      title: confirmed ? 'Move-in confirmed by landlord' : 'Move-in request declined',
      message: confirmed
        ? 'The landlord confirmed your occupancy' + (input.paymentConfirmed ? ' and payment of ₦' + input.paymentAmount?.toLocaleString() + '.' : '. Payment is not recorded as confirmed.')
        : 'Contact the landlord if you believe the move-in record was rejected in error.',
      href: '/inspections', deduplicationKey: 'occupancy:' + occupancy.id + ':decision:' + input.decision, scheduledFor: new Date(),
    }], skipDuplicates: true });
    await transaction.systemLog.create({ data: { eventType: SystemLogEventType.RENTAL_APPLICATION_EVENT, actorId: input.landlordId, targetType: 'OCCUPANCY', targetId: occupancy.id, summary: confirmed ? 'A landlord confirmed a student move-in.' : 'A landlord declined a student move-in.', metadata: { status: confirmed ? OccupancyStatus.ACTIVE : OccupancyStatus.DECLINED, paymentConfirmed: confirmed && input.paymentConfirmed, ...(input.paymentAmount ? { paymentAmount: input.paymentAmount } : {}) } } });
    return transaction.occupancy.findUnique({ where: { id: occupancy.id }, include: occupancyDetails });
  });
}
