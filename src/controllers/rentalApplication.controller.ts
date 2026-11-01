import type { FastifyReply, FastifyRequest } from 'fastify';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { createRentalApplication, listLandlordApplications, listMyRentalApplications, respondToRentalApplication, withdrawRentalApplication } from '../services/index.js';
import { createRentalApplicationSchema, rentalApplicationResponseSchema } from '../validations/rentalApplication.validation.js';

export async function createStudentApplication(request: FastifyRequest, reply: FastifyReply) {
  const body = createRentalApplicationSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const result = await createRentalApplication({ studentId: userId(request), inspectionId: body.data.inspectionId, requestId: request.id, ...(body.data.moveInDate ? { moveInDate: body.data.moveInDate } : {}), ...(body.data.studentMessage ? { studentMessage: body.data.studentMessage } : {}) });
  if (!result) throw new ConflictError(ERROR_MESSAGES.rentalApplicationUnavailable);
  return reply.code(201).send({ application: result });
}

export async function getStudentApplications(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ applications: await listMyRentalApplications(userId(request)) });
}

export async function getLandlordApplications(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ applications: await listLandlordApplications(userId(request)) });
}

export async function decideRentalApplication(request: FastifyRequest, reply: FastifyReply) {
  const body = rentalApplicationResponseSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const application = await respondToRentalApplication({ applicationId: routeParameter(request, 'applicationId'), landlordId: userId(request), status: body.data.status, requestId: request.id, ...(body.data.landlordResponse ? { landlordResponse: body.data.landlordResponse } : {}) });
  if (!application) throw new NotFoundError(ERROR_MESSAGES.rentalApplicationNotFound);
  return reply.send({ application });
}

export async function withdrawStudentApplication(request: FastifyRequest, reply: FastifyReply) {
  const application = await withdrawRentalApplication({ applicationId: routeParameter(request, 'applicationId'), studentId: userId(request), requestId: request.id });
  if (!application) throw new ConflictError(ERROR_MESSAGES.rentalApplicationDecisionUnavailable);
  return reply.send({ application });
}

function userId(request: FastifyRequest) {
  if (!request.authenticatedUser) throw new ForbiddenError();
  return request.authenticatedUser.id;
}

function routeParameter(request: FastifyRequest, key: string) {
  const value = (request.params as Record<string, string>)[key];
  if (!value) throw new NotFoundError();
  return value;
}
