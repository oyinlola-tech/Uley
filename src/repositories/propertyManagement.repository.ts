import { AdminActionType, Prisma, PropertyStatus, VerificationStatus } from '@prisma/client';
import type { CreateLandlordPropertyDto, ReviewVerificationDto } from '../dtos/propertyManagement.dto.js';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { ReviewDecision } from '../enums/reviewDecision.enum.js';
import { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import { writeSystemLogEntry } from '../utils/systemLog.writer.js';

export async function createLandlordProperty(input: CreateLandlordPropertyDto) {
  if (input.clientDraftId) {
    const existingDraft = await prismaDatabaseClient.property.findUnique({ where: { clientDraftId: input.clientDraftId } });
    if (existingDraft) {
      if (existingDraft.landlordId !== input.landlordId) throw new ConflictError(ERROR_MESSAGES.propertyAlreadyPendingReview);
      return existingDraft;
    }
  }
  const landlord = await prismaDatabaseClient.user.findUnique({ where: { id: input.landlordId }, select: { universityId: true } });
  if (!landlord?.universityId) throw new ConflictError(ERROR_MESSAGES.universitySelectionUnavailable);
  try { return await prismaDatabaseClient.property.create({
    data: {
      landlordId: input.landlordId, universityId: landlord.universityId, name: input.name, description: input.description,
      ...(input.clientDraftId ? { clientDraftId: input.clientDraftId } : {}),
      streetAddress: input.streetAddress, neighborhood: input.neighborhood, city: input.city, state: input.state,
      ...(input.latitude !== undefined && input.longitude !== undefined ? { latitude: input.latitude, longitude: input.longitude } : {}),
      units: { create: { name: input.unitName, rentAmount: input.rentAmount, rentalPeriod: input.rentalPeriod, securityDeposit: input.securityDeposit, monthlyServiceCharge: input.monthlyServiceCharge, inspectionFee: input.inspectionFee, bedrooms: input.bedrooms, bathrooms: input.bathrooms } },
    }, include: { units: true },
  }); } catch (error) {
    if (!input.clientDraftId || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    const concurrentlyCreatedDraft = await prismaDatabaseClient.property.findUnique({ where: { clientDraftId: input.clientDraftId } });
    if (concurrentlyCreatedDraft?.landlordId === input.landlordId) return concurrentlyCreatedDraft;
    throw error;
  }
}

export async function submitPropertyForReview(propertyId: string, landlordId: string) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const property = await transaction.property.findFirst({ where: { id: propertyId, landlordId }, include: { units: true, images: true } });
    if (!property) return null;
    if (property.status === PropertyStatus.PENDING_VERIFICATION) throw new ConflictError(ERROR_MESSAGES.propertyAlreadyPendingReview);
    if (!property.units.some((unit) => unit.isAvailable)) return { property, submitted: false };
    if (!property.images.length) throw new ConflictError(ERROR_MESSAGES.propertySubmissionRequiresImage);
    const now = new Date();
    await transaction.propertyVerification.upsert({
      where: { propertyId }, create: { propertyId, status: VerificationStatus.PENDING, submittedAt: now },
      update: { status: VerificationStatus.PENDING, submittedAt: now, reviewedAt: null, rejectionReason: null },
    });
    const submittedProperty = await transaction.property.update({ where: { id: propertyId }, data: { status: PropertyStatus.PENDING_VERIFICATION } });
    return { property: submittedProperty, submitted: true };
  });
}

export async function findLandlordProperties(landlordId: string) {
  return prismaDatabaseClient.property.findMany({
    where: { landlordId }, include: { verification: true, units: true, images: true }, orderBy: { updatedAt: 'desc' },
  });
}

export async function requestLandlordVerification(landlordId: string) {
  return prismaDatabaseClient.landlordVerification.upsert({
    where: { landlordId }, create: { landlordId, status: VerificationStatus.PENDING },
    update: { status: VerificationStatus.PENDING, submittedAt: new Date(), reviewedAt: null, rejectionReason: null },
  });
}

export async function getLandlordVerification(landlordId: string) {
  return prismaDatabaseClient.landlordVerification.findUnique({ where: { landlordId } });
}

export async function findPendingVerificationReviews() {
  const [landlordVerifications, propertyVerifications] = await Promise.all([
    prismaDatabaseClient.landlordVerification.findMany({
      where: { status: VerificationStatus.PENDING }, include: { landlord: { select: { id: true, fullName: true, email: true } } }, orderBy: { submittedAt: 'asc' },
    }),
    prismaDatabaseClient.propertyVerification.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { property: { include: { units: true, images: true, landlord: { select: { id: true, fullName: true, email: true } } } } },
      orderBy: { submittedAt: 'asc' },
    }),
  ]);
  return { landlordVerifications, propertyVerifications };
}

export async function reviewLandlordVerification(landlordId: string, input: ReviewVerificationDto) {
  const existingVerification = await prismaDatabaseClient.landlordVerification.findUnique({ where: { landlordId } });
  if (!existingVerification) throw new NotFoundError(ERROR_MESSAGES.verificationRecordMissing);
  const status = input.decision === ReviewDecision.APPROVED ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const result = await transaction.landlordVerification.updateMany({
      where: { landlordId, status: VerificationStatus.PENDING },
      data: { status, reviewedAt: new Date(), reviewedById: input.reviewerId, rejectionReason: input.rejectionReason ?? null },
    });
    if (!result.count) throw new ConflictError(ERROR_MESSAGES.verificationNoLongerPending);
    const actionType = input.decision === ReviewDecision.APPROVED ? AdminActionType.LANDLORD_VERIFICATION_APPROVED : AdminActionType.LANDLORD_VERIFICATION_REJECTED;
    const reason = input.rejectionReason ?? 'Landlord verification approved after school review.';
    await transaction.adminAction.create({ data: { actorId: input.reviewerId, actionType, targetType: 'LANDLORD', targetId: landlordId, reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.reviewerId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'LANDLORD', targetId: landlordId, summary: `${actionType} completed`, metadata: { actionType, reason } });
    return transaction.landlordVerification.findUniqueOrThrow({ where: { landlordId } });
  });
}

export async function reviewPropertyVerification(propertyId: string, input: ReviewVerificationDto) {
  const existingVerification = await prismaDatabaseClient.propertyVerification.findUnique({ where: { propertyId } });
  if (!existingVerification) throw new NotFoundError(ERROR_MESSAGES.verificationRecordMissing);
  const status = input.decision === ReviewDecision.APPROVED ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
  const propertyStatus = input.decision === ReviewDecision.APPROVED ? PropertyStatus.PUBLISHED : PropertyStatus.REJECTED;
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const property = await transaction.property.findUnique({ where: { id: propertyId }, select: { landlordId: true } });
    if (!property) throw new NotFoundError();
    if (input.decision === ReviewDecision.APPROVED) {
      const landlordVerification = await transaction.landlordVerification.findUnique({ where: { landlordId: property.landlordId } });
      if (landlordVerification?.status !== VerificationStatus.APPROVED) {
        throw new ConflictError(ERROR_MESSAGES.landlordVerificationMustPrecedeProperty);
      }
    }
    const result = await transaction.propertyVerification.updateMany({
      where: { propertyId, status: VerificationStatus.PENDING },
      data: { status, reviewedAt: new Date(), reviewedById: input.reviewerId, rejectionReason: input.rejectionReason ?? null },
    });
    if (!result.count) throw new ConflictError(ERROR_MESSAGES.verificationNoLongerPending);
    await transaction.property.update({ where: { id: propertyId }, data: { status: propertyStatus } });
    const actionType = input.decision === ReviewDecision.APPROVED ? AdminActionType.PROPERTY_VERIFICATION_APPROVED : AdminActionType.PROPERTY_VERIFICATION_REJECTED;
    const reason = input.rejectionReason ?? 'Property verification approved after school review.';
    await transaction.adminAction.create({ data: { actorId: input.reviewerId, actionType, targetType: 'PROPERTY', targetId: propertyId, reason, ...(input.requestId ? { requestId: input.requestId } : {}) } });
    await writeSystemLogEntry(transaction, { eventType: SystemLogEventType.ADMIN_ACTION, actorId: input.reviewerId, ...(input.requestId ? { requestId: input.requestId } : {}), targetType: 'PROPERTY', targetId: propertyId, summary: `${actionType} completed`, metadata: { actionType, reason } });
    return transaction.propertyVerification.findUniqueOrThrow({ where: { propertyId } });
  });
}
