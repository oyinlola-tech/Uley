import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPublicPropertyDetail } from '../services/properties/queries/getPublicPropertyDetail.query.js';
import { NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function getPublicPropertyDetailById(request: FastifyRequest, reply: FastifyReply) {
  const propertyId = (request.params as { propertyId?: string }).propertyId;
  if (!propertyId) throw new NotFoundError(ERROR_MESSAGES.notFound);
  return reply.code(200).send(await getPublicPropertyDetail(propertyId));
}
