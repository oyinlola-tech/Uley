import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '../enums/userRole.enum.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { getInspectionSharedLocation, listLandlordInspectionRequests, listStudentInspectionRequests, requestPropertyInspection, respondToInspectionRequest, startInspectionLocationShare, stopInspectionLocationShare, updateInspectionLocation } from '../services/inspections/index.js';
import { inspectionLocationPointSchema, requestInspectionSchema, respondToInspectionSchema } from '../validations/property.validation.js';

export async function createInspectionRequest(request: FastifyRequest, reply: FastifyReply) {
  const studentId = requireRole(request, UserRole.STUDENT);
  const body = requestInspectionSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const inspection = await requestPropertyInspection({ unitId: body.data.unitId, scheduledFor: body.data.scheduledFor, studentId, ...(body.data.studentMessage ? { studentMessage: body.data.studentMessage } : {}) });
  if (!inspection) throw new NotFoundError(ERROR_MESSAGES.inspectionUnitUnavailable);
  return reply.code(201).send({ inspection });
}

export async function getMyInspectionRequests(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ inspections: await listStudentInspectionRequests(requireRole(request, UserRole.STUDENT)) });
}

export async function getLandlordInspectionRequests(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ inspections: await listLandlordInspectionRequests(requireRole(request, UserRole.LANDLORD)) });
}

export async function respondToInspection(request: FastifyRequest, reply: FastifyReply) {
  const landlordId = requireRole(request, UserRole.LANDLORD);
  const body = respondToInspectionSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { inspectionId } = request.params as { inspectionId: string };
  if (!inspectionId) throw new NotFoundError();
  const inspection = await respondToInspectionRequest({ decision: body.data.decision, inspectionId, landlordId, ...(body.data.landlordResponse ? { landlordResponse: body.data.landlordResponse } : {}) });
  if (!inspection) throw new ConflictError(ERROR_MESSAGES.inspectionRequestNoLongerPending);
  return reply.send({ inspection });
}

function requireRole(request: FastifyRequest, role: UserRole): string {
  if (!request.authenticatedUser) throw new ForbiddenError();
  if (request.authenticatedUser.userRole !== role) throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired(role.toLowerCase()));
  return request.authenticatedUser.id;
}

export async function startSharingInspectionLocation(request: FastifyRequest, reply: FastifyReply) {
  const studentId = requireRole(request, UserRole.STUDENT);
  const share = await startInspectionLocationShare({ inspectionId: getInspectionId(request), participantId: studentId });
  if (!share) throw new ConflictError(ERROR_MESSAGES.inspectionLocationShareUnavailable);
  return reply.code(200).send({ sharing: true });
}

export async function updateSharedInspectionLocation(request: FastifyRequest, reply: FastifyReply) {
  const studentId = requireRole(request, UserRole.STUDENT);
  const point = inspectionLocationPointSchema.safeParse(request.body);
  if (!point.success) throw new ValidationError();
  const share = await updateInspectionLocation({ inspectionId: getInspectionId(request), participantId: studentId, ...point.data });
  if (!share) throw new ConflictError(ERROR_MESSAGES.inspectionLocationShareNotActive);
  return reply.code(200).send({ updatedAt: share.locationUpdatedAt });
}

export async function stopSharingInspectionLocation(request: FastifyRequest, reply: FastifyReply) {
  await stopInspectionLocationShare({ inspectionId: getInspectionId(request), participantId: requireRole(request, UserRole.STUDENT) });
  return reply.code(204).send();
}

export async function getSharedInspectionLocation(request: FastifyRequest, reply: FastifyReply) {
  const participantId = request.authenticatedUser?.id;
  if (!participantId) throw new ForbiddenError();
  return reply.send(await getInspectionSharedLocation({ inspectionId: getInspectionId(request), participantId }));
}

function getInspectionId(request: FastifyRequest): string {
  const { inspectionId } = request.params as { inspectionId: string };
  if (!inspectionId) throw new NotFoundError();
  return inspectionId;
}
