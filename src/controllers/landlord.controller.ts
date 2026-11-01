import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '../enums/userRole.enum.js';
import { VerificationStatus } from '../enums/verificationStatus.enum.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { getLandlordVerificationStatus, requestLandlordVerification } from '../services/landlord-verifications/index.js';
import { createLandlordProperty, listLandlordProperties, submitPropertyForReview, updateLandlordPropertyDraft } from '../services/properties/index.js';
import { parseCreatePropertyRequest, parseUpdatePropertyRequest } from '../validations/property.validation.js';
import { assignCaretakerToProperty, getPropertyCaretakers, removeCaretakerFromProperty } from '../services/caretakers/index.js';
import { propertyCaretakerAssignmentSchema, propertyCaretakerParamsSchema, propertyCaretakerRemovalParamsSchema } from '../validations/propertyCaretaker.validation.js';

function getLandlordId(request: FastifyRequest): string {
  if (request.authenticatedUser?.userRole !== UserRole.LANDLORD) throw new ForbiddenError();
  return request.authenticatedUser.id;
}

export async function getMyLandlordVerification(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ verification: await getLandlordVerificationStatus(getLandlordId(request)) });
}

export async function requestMyLandlordVerification(request: FastifyRequest, reply: FastifyReply) {
  const landlordId = getLandlordId(request);
  const currentVerification = await getLandlordVerificationStatus(landlordId);
  if (currentVerification?.status === VerificationStatus.APPROVED) throw new ConflictError(ERROR_MESSAGES.landlordAlreadyApproved);
  if (currentVerification?.status === VerificationStatus.SUSPENDED) throw new ForbiddenError(ERROR_MESSAGES.landlordVerificationSuspended);
  if (currentVerification?.status === VerificationStatus.PENDING) throw new ConflictError(ERROR_MESSAGES.landlordVerificationAlreadyPending);
  return reply.code(201).send({ verification: await requestLandlordVerification(landlordId) });
}

export async function getMyProperties(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ properties: await listLandlordProperties(getLandlordId(request)) });
}

export async function createMyProperty(request: FastifyRequest, reply: FastifyReply) {
  const parsedBody = parseCreatePropertyRequest(request.body);
  if (!parsedBody.success) throw new ValidationError();
  const coordinates = parsedBody.data.latitude !== undefined && parsedBody.data.longitude !== undefined
    ? { latitude: parsedBody.data.latitude, longitude: parsedBody.data.longitude }
    : {};
  return reply.code(201).send({ property: await createLandlordProperty({ ...parsedBody.data, ...coordinates, landlordId: getLandlordId(request) }) });
}

export async function updateMyPropertyDraft(request: FastifyRequest, reply: FastifyReply) {
  const { propertyId } = request.params as { propertyId: string };
  const parsedBody = parseUpdatePropertyRequest(request.body);
  if (!propertyId || !parsedBody.success) throw new ValidationError();
  const coordinates = parsedBody.data.latitude !== undefined && parsedBody.data.longitude !== undefined
    ? { latitude: parsedBody.data.latitude, longitude: parsedBody.data.longitude }
    : {};
  return reply.send({ property: await updateLandlordPropertyDraft({ ...parsedBody.data, ...coordinates, propertyId, landlordId: getLandlordId(request) }) });
}

export async function submitMyPropertyForReview(request: FastifyRequest, reply: FastifyReply) {
  const { propertyId } = request.params as { propertyId: string };
  if (!propertyId) throw new NotFoundError();
  return reply.send({ property: await submitPropertyForReview(propertyId, getLandlordId(request)) });
}

export async function getMyPropertyCaretakers(request: FastifyRequest, reply: FastifyReply) {
  const { propertyId } = parsePropertyCaretakerParams(request);
  return reply.send({ caretakers: await getPropertyCaretakers(propertyId, getLandlordId(request)) });
}

export async function assignMyPropertyCaretaker(request: FastifyRequest, reply: FastifyReply) {
  const body = propertyCaretakerAssignmentSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { propertyId } = parsePropertyCaretakerParams(request);
  return reply.code(201).send({ assignment: await assignCaretakerToProperty({ propertyId, landlordId: getLandlordId(request), emailAddress: body.data.emailAddress, requestId: request.id }) });
}

export async function removeMyPropertyCaretaker(request: FastifyRequest, reply: FastifyReply) {
  const parsedParams = propertyCaretakerRemovalParamsSchema.safeParse(request.params);
  if (!parsedParams.success) throw new ValidationError();
  const { propertyId, caretakerUserId } = parsedParams.data;
  await removeCaretakerFromProperty({ propertyId, landlordId: getLandlordId(request), caretakerUserId, requestId: request.id });
  return reply.code(204).send();
}

function parsePropertyCaretakerParams(request: FastifyRequest) {
  const params = propertyCaretakerParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError();
  return params.data;
}
