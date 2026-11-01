import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { registerPushDevice, removePushDevice } from '../services/notifications/index.js';
import { registerPushDeviceSchema, removePushDeviceSchema } from '../validations/pushNotification.validation.js';

export async function registerAuthenticatedPushDevice(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.authenticatedUser?.id;
  const parsedBody = registerPushDeviceSchema.safeParse(request.body);
  if (!userId) throw new UnauthorizedError(ERROR_MESSAGES.unauthorized);
  if (!parsedBody.success) throw new ValidationError();
  await registerPushDevice({ userId, ...parsedBody.data });
  return reply.code(204).send();
}

export async function removeAuthenticatedPushDevice(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.authenticatedUser?.id;
  const parsedBody = removePushDeviceSchema.safeParse(request.body);
  if (!userId) throw new UnauthorizedError(ERROR_MESSAGES.unauthorized);
  if (!parsedBody.success) throw new ValidationError();
  await removePushDevice({ userId, ...parsedBody.data });
  return reply.code(204).send();
}
