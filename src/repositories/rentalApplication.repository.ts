import { InspectionFeedbackOutcome, InspectionStatus, NotificationType, OccupancyStatus, PropertyStatus, RentalApplicationStatus, SystemLogEventType, UserRole, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

const applicationDetails = {
  student: { select: { id: true, fullName: true, email: true } },
  landlord: { select: { id: true, fullName: true } },
  property: { select: { id: true, name: true, neighborhood: true, city: true } },
  unit: { select: { id: true, name: true, rentAmount: true, rentalPeriod: true, securityDeposit: true, inspectionFee: true } },
  inspection: { select: { id: true, scheduledFor: true, completedAt: true } },
};

export function listStudentRentalApplications(studentId: string) {
  return prismaDatabaseClient.rentalApplication.findMany({ where: { studentId }, include: applicationDetails, orderBy: { createdAt: 'desc' } });
}

export function listLandlordRentalApplications(landlordId: string) {
  return prismaDatabaseClient.rentalApplication.findMany({ where: { landlordId }, include: applicationDetails, orderBy: { createdAt: 'desc' } });
}

export async function submitRentalApplication(input: { studentId: string; inspectionId: string; moveInDate?: Date; studentMessage?: string; requestId?: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const inspection = await transaction.inspection.findFirst({
      where: {
        id: input.inspectionId, studentId: input.studentId, status: InspectionStatus.COMPLETED,
        feedback: { is: { outcome: { in: [InspectionFeedbackOutcome.INTERESTED, InspectionFeedbackOutcome.NEEDS_FOLLOW_UP] } } },
        property: { status: PropertyStatus.PUBLISHED, verification: { is: { status: VerificationStatus.APPROVED } }, landlord: { role: UserRole.LANDLORD, isActive: true, landlordVerification: { is: { status: VerificationStatus.APPROVED } } } },
        unit: { isAvailable: true },
      },
      include: { property: { select: { id: true, name: true, landlordId: true } }, unit: { select: { id: true } } },
    });
    if (!inspection) return null;
    const activeApplication = await transaction.rentalApplication.findFirst({
      where: { studentId: input.studentId, unitId: inspection.unitId, status: { in: [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW, RentalApplicationStatus.APPROVED] } },
      select: { id: true },
    });
    const approvedForUnit = await transaction.rentalApplication.findFirst({ where: { unitId: inspection.unitId, status: RentalApplicationStatus.APPROVED }, select: { id: true } });
    const pendingMoveIn = await transaction.occupancy.findFirst({ where: { unitId: inspection.unitId, status: OccupancyStatus.REQUESTED }, select: { id: true } });
    if (activeApplication || approvedForUnit || pendingMoveIn || await transaction.occupancy.findUnique({ where: { inspectionId: inspection.id }, select: { id: true } })) {
      throw new ConflictError(ERROR_MESSAGES.rentalApplicationAlreadyExists);
    }
    const application = await transaction.rentalApplication.create({
      data: { inspectionId: inspection.id, studentId: input.studentId, landlordId: inspection.property.landlordId, propertyId: inspection.property.id, unitId: inspection.unitId, ...(input.moveInDate ? { moveInDate: input.moveInDate } : {}), ...(input.studentMessage ? { studentMessage: input.studentMessage } : {}) },
      include: applicationDetails,
    });
    await transaction.notification.create({ data: { recipientId: inspection.property.landlordId, type: NotificationType.APPLICATION_RECEIVED, title: 'New rental application', message: application.student.fullName + ' applied for ' + inspection.property.name + '.', href: '/landlord/applications', deduplicationKey: 'rental-application:' + application.id + ':received', scheduledFor: new Date() } });
    await transaction.systemLog.create({ data: { eventType: SystemLogEventType.RENTAL_APPLICATION_EVENT, actorId: input.studentId, ...(input.requestId ? { requestId: input.requestId } : {}), route: '/api/v1/applications', method: 'POST', targetType: 'RENTAL_APPLICATION', targetId: application.id, summary: 'A student submitted a rental application.', metadata: { status: RentalApplicationStatus.SUBMITTED, propertyId: inspection.property.id, unitId: inspection.unitId } } });
    return application;
  });
}

export async function respondToRentalApplication(input: { applicationId: string; landlordId: string; status: RentalApplicationStatus; landlordResponse?: string; requestId?: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const application = await transaction.rentalApplication.findFirst({ where: { id: input.applicationId, landlordId: input.landlordId, status: { in: [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW] } }, include: { property: { select: { name: true } } } });
    if (!application) return null;
    if (input.status === RentalApplicationStatus.APPROVED) {
      const occupied = await transaction.occupancy.findFirst({ where: { unitId: application.unitId, status: { in: [OccupancyStatus.ACTIVE, OccupancyStatus.REQUESTED] } }, select: { id: true } });
      const approved = await transaction.rentalApplication.findFirst({ where: { unitId: application.unitId, status: RentalApplicationStatus.APPROVED, id: { not: application.id } }, select: { id: true } });
      if (occupied || approved) throw new ConflictError(ERROR_MESSAGES.rentalApplicationDecisionUnavailable);
      const reserved = await transaction.propertyUnit.updateMany({ where: { id: application.unitId, isAvailable: true }, data: { isAvailable: false } });
      if (!reserved.count) throw new ConflictError(ERROR_MESSAGES.rentalApplicationDecisionUnavailable);
      await transaction.occupancy.create({ data: { inspectionId: application.inspectionId, studentId: application.studentId, landlordId: application.landlordId, propertyId: application.propertyId, unitId: application.unitId, ...(application.moveInDate ? { moveInDate: application.moveInDate } : {}) } });
    }
    const updated = await transaction.rentalApplication.update({ where: { id: application.id }, data: { status: input.status, reviewedAt: new Date(), ...(input.landlordResponse ? { landlordResponse: input.landlordResponse } : {}) }, include: applicationDetails });
    await transaction.systemLog.create({ data: { eventType: SystemLogEventType.RENTAL_APPLICATION_EVENT, actorId: input.landlordId, ...(input.requestId ? { requestId: input.requestId } : {}), route: '/api/v1/landlord/applications/:applicationId/respond', method: 'POST', targetType: 'RENTAL_APPLICATION', targetId: application.id, summary: 'A landlord changed a rental application decision.', metadata: { status: input.status, previousStatus: application.status, propertyId: application.propertyId, unitId: application.unitId } } });
    await transaction.notification.createMany({ data: [{ recipientId: application.studentId, type: NotificationType.APPLICATION_DECISION, title: getDecisionTitle(input.status), message: input.landlordResponse ?? getDecisionMessage(input.status, application.property.name), href: '/applications', deduplicationKey: 'rental-application:' + application.id + ':' + input.status.toLowerCase(), scheduledFor: new Date() }], skipDuplicates: true });
    if (input.status === RentalApplicationStatus.APPROVED) {
      await transaction.notification.create({ data: { recipientId: application.landlordId, type: NotificationType.OCCUPANCY_REQUESTED, title: 'Confirm the student’s move-in', message: 'Your rental application was approved. Confirm the move-in and record payment after the agreement is complete.', href: '/landlord/inspections', deduplicationKey: 'rental-application:' + application.id + ':move-in', scheduledFor: new Date() } });
    }
    return updated;
  });
}

export async function withdrawRentalApplication(input: { applicationId: string; studentId: string; requestId?: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const changed = await transaction.rentalApplication.updateMany({ where: { id: input.applicationId, studentId: input.studentId, status: { in: [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW] } }, data: { status: RentalApplicationStatus.WITHDRAWN } });
    if (!changed.count) return null;
    const application = await transaction.rentalApplication.findUnique({ where: { id: input.applicationId }, include: applicationDetails });
    if (application) {
      await transaction.notification.createMany({ data: [{ recipientId: application.landlordId, type: NotificationType.APPLICATION_DECISION, title: 'Student withdrew a rental application', message: application.student.fullName + ' withdrew their application for ' + application.property.name + '.', href: '/landlord/applications', deduplicationKey: 'rental-application:' + application.id + ':withdrawn', scheduledFor: new Date() }], skipDuplicates: true });
      await transaction.systemLog.create({ data: { eventType: SystemLogEventType.RENTAL_APPLICATION_EVENT, actorId: input.studentId, ...(input.requestId ? { requestId: input.requestId } : {}), route: '/api/v1/applications/:applicationId/withdraw', method: 'POST', targetType: 'RENTAL_APPLICATION', targetId: application.id, summary: 'A student withdrew a rental application.', metadata: { status: RentalApplicationStatus.WITHDRAWN } } });
    }
    return application;
  });
}

function getDecisionTitle(status: RentalApplicationStatus) { return status === RentalApplicationStatus.APPROVED ? 'Your rental application was approved' : status === RentalApplicationStatus.DECLINED ? 'Your rental application was declined' : 'Your application is under review'; }
function getDecisionMessage(status: RentalApplicationStatus, propertyName: string) { return status === RentalApplicationStatus.APPROVED ? propertyName + ' · the landlord will confirm move-in details separately.' : status === RentalApplicationStatus.DECLINED ? propertyName + ' · you can continue searching for another home.' : propertyName + ' · the landlord is reviewing your details.'; }
