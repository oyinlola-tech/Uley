import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { listMyNotifications, markNotificationRead } from '../services/notifications/index.js';

export async function getMyNotifications(request: FastifyRequest, reply: FastifyReply) {
  const recipientId = request.authenticatedUser?.id;
  if (!recipientId) throw new NotFoundError(ERROR_MESSAGES.notificationNotFound);
  return reply.send(await listMyNotifications(recipientId));
}

export async function markMyNotificationRead(request: FastifyRequest, reply: FastifyReply) {
  const recipientId = request.authenticatedUser?.id;
  const { notificationId } = request.params as { notificationId: string };
  if (!recipientId || !notificationId) throw new NotFoundError(ERROR_MESSAGES.notificationNotFound);
  const count = await markNotificationRead({ notificationId, recipientId });
  if (!count) throw new NotFoundError(ERROR_MESSAGES.notificationNotFound);
  return reply.code(204).send();
}
