import { InspectionStatus, PropertyStatus, UserRole, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { RequestInspectionDto, RespondToInspectionDto } from '../dtos/inspection.dto.js';
import { NotificationType } from '@prisma/client';
import { enqueueInspectionReminders, enqueueUserNotification } from './notification.repository.js';

export async function createInspectionRequest(input: RequestInspectionDto) {
  const unit = await prismaDatabaseClient.propertyUnit.findFirst({
    where: {
      id: input.unitId,
      isAvailable: true,
      property: {
        status: PropertyStatus.PUBLISHED,
        verification: { is: { status: VerificationStatus.APPROVED } },
        landlord: { role: UserRole.LANDLORD, isActive: true, landlordVerification: { is: { status: VerificationStatus.APPROVED } } },
      },
    },
    select: { id: true, name: true, propertyId: true, property: { select: { landlordId: true, name: true } } },
  });
  if (!unit) return null;
  const inspection = await prismaDatabaseClient.inspection.create({
    data: { ...input, propertyId: unit.propertyId },
    include: inspectionDetails,
  });
  await enqueueUserNotification({
    recipientId: unit.property.landlordId,
    type: NotificationType.INSPECTION_REQUESTED,
    title: 'New inspection request',
    message: inspection.student.fullName + ' requested a visit to ' + unit.property.name + ' · ' + unit.name + '.',
    href: '/landlord/inspections',
    deduplicationKey: 'inspection:' + inspection.id + ':requested:' + unit.property.landlordId,
  });
  return inspection;
}

export async function findStudentInspections(studentId: string) {
  return prismaDatabaseClient.inspection.findMany({
    where: { studentId }, orderBy: { scheduledFor: 'asc' }, include: inspectionDetails,
  });
}

export async function findLandlordInspections(landlordId: string) {
  return prismaDatabaseClient.inspection.findMany({
    where: { property: { landlordId } }, orderBy: { scheduledFor: 'asc' }, include: inspectionDetails,
  });
}

export async function updateLandlordInspectionResponse(input: RespondToInspectionDto) {
  const updatedRequest = await prismaDatabaseClient.inspection.updateMany({
    where: { id: input.inspectionId, property: { is: { landlordId: input.landlordId } }, status: InspectionStatus.REQUESTED },
    data: { status: input.decision, ...(input.landlordResponse ? { landlordResponse: input.landlordResponse } : {}), respondedAt: new Date() },
  });
  if (updatedRequest.count === 0) return null;
  const inspection = await prismaDatabaseClient.inspection.findUnique({ where: { id: input.inspectionId }, include: inspectionDetails });
  if (!inspection) return null;
  const type = input.decision === InspectionStatus.CONFIRMED ? NotificationType.INSPECTION_CONFIRMED : NotificationType.INSPECTION_DECLINED;
  await enqueueUserNotification({
    recipientId: inspection.studentId, type,
    title: input.decision === InspectionStatus.CONFIRMED ? 'Your visit is confirmed' : 'Your visit request was declined',
    message: inspection.property.name + ' · ' + inspection.unit.name + ' · ' + inspection.scheduledFor.toLocaleString(),
    href: '/inspections',
    deduplicationKey: 'inspection:' + inspection.id + ':landlord-response:' + input.decision,
  });
  if (input.decision === InspectionStatus.CONFIRMED) {
    await enqueueInspectionReminders({
      inspectionId: inspection.id, scheduledFor: inspection.scheduledFor,
      studentId: inspection.studentId, landlordId: input.landlordId,
      propertyName: inspection.property.name, unitName: inspection.unit.name,
    });
  }
  return inspection;
}

const inspectionDetails = {
  property: { select: { id: true, name: true, streetAddress: true, neighborhood: true, city: true } },
  unit: { select: { id: true, name: true, rentAmount: true, rentalPeriod: true } },
  student: { select: { id: true, fullName: true, email: true } },
  rescheduleRequests: { orderBy: { createdAt: 'desc' as const }, take: 5 },
  feedback: true,
  occupancy: { include: { review: true } },
  rentalApplication: { select: { id: true, status: true } },
};
