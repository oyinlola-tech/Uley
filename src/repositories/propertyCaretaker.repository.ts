import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { CARETAKER_ASSIGNMENT_MESSAGES } from '../constants/caretaker.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';

export async function listPropertyCaretakers(propertyId: string, landlordId: string) {
  await assertPropertyOwned(propertyId, landlordId);
  return prismaDatabaseClient.propertyCaretaker.findMany({
    where: { propertyId, removedAt: null },
    orderBy: { assignedAt: 'asc' },
    select: { id: true, assignedAt: true, caretaker: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function assignPropertyCaretaker(input: { propertyId: string; landlordId: string; emailAddress: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const property = await transaction.property.findFirst({ where: { id: input.propertyId, landlordId: input.landlordId }, select: { id: true, name: true } });
    if (!property) throw new NotFoundError(ERROR_MESSAGES.caretakerPropertyNotFound);
    const caretaker = await transaction.user.findFirst({ where: { email: input.emailAddress.toLowerCase(), role: UserRole.CARETAKER, isActive: true }, select: { id: true, fullName: true, email: true } });
    if (!caretaker) throw new NotFoundError(ERROR_MESSAGES.caretakerAccountNotFound);
    const existing = await transaction.propertyCaretaker.findUnique({ where: { propertyId_caretakerUserId: { propertyId: property.id, caretakerUserId: caretaker.id } } });
    if (existing && !existing.removedAt) throw new ConflictError(ERROR_MESSAGES.caretakerAlreadyAssigned);
    const assignment = existing
      ? await transaction.propertyCaretaker.update({ where: { id: existing.id }, data: { assignedByLandlordId: input.landlordId, assignedAt: new Date(), removedAt: null } })
      : await transaction.propertyCaretaker.create({ data: { propertyId: property.id, caretakerUserId: caretaker.id, assignedByLandlordId: input.landlordId } });
    await transaction.notification.create({ data: { recipientId: caretaker.id, type: NotificationType.PROPERTY_CARETAKER_ASSIGNED, title: CARETAKER_ASSIGNMENT_MESSAGES.notificationTitle, message: CARETAKER_ASSIGNMENT_MESSAGES.notificationBody(property.name), href: '/caretaker/complaints', deduplicationKey: `caretaker-assignment:${assignment.id}:${assignment.assignedAt.toISOString()}`, scheduledFor: new Date() } });
    await transaction.systemLog.create({ data: { eventType: 'PROPERTY_CARETAKER_CHANGED', level: 'INFO', actorId: input.landlordId, requestId: input.requestId, targetType: 'PROPERTY_CARETAKER', targetId: assignment.id, summary: 'A landlord assigned a caretaker to a property.', metadata: { propertyId: property.id, caretakerId: caretaker.id, action: 'ASSIGNED' } } });
    return { ...assignment, caretaker };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function removePropertyCaretaker(input: { propertyId: string; landlordId: string; caretakerUserId: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    await assertPropertyOwned(input.propertyId, input.landlordId, transaction);
    const result = await transaction.propertyCaretaker.updateMany({ where: { propertyId: input.propertyId, caretakerUserId: input.caretakerUserId, removedAt: null }, data: { removedAt: new Date() } });
    if (!result.count) throw new NotFoundError(ERROR_MESSAGES.caretakerAssignmentNotFound);
    await transaction.systemLog.create({ data: { eventType: 'PROPERTY_CARETAKER_CHANGED', level: 'INFO', actorId: input.landlordId, requestId: input.requestId, targetType: 'PROPERTY_CARETAKER', targetId: input.caretakerUserId, summary: 'A landlord removed a property caretaker.', metadata: { propertyId: input.propertyId, action: 'REMOVED' } } });
  });
}

async function assertPropertyOwned(propertyId: string, landlordId: string, client: Pick<Prisma.TransactionClient, 'property'> = prismaDatabaseClient) {
  const property = await client.property.findFirst({ where: { id: propertyId, landlordId }, select: { id: true } });
  if (!property) throw new NotFoundError(ERROR_MESSAGES.caretakerPropertyNotFound);
}
