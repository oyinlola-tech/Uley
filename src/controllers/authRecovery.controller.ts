import type { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../errors/app.error.js';
import { AUTH_RESPONSE_MESSAGES } from '../constants/authResponse.constant.js';
import { requestPasswordResetCode, resetAccountPassword, verifyPasswordResetCode } from '../services/auth/index.js';
import {
  requestPasswordResetCodeRequestSchema,
  resetAccountPasswordRequestSchema,
  verifyPasswordResetCodeRequestSchema,
} from '../validations/auth.validation.js';

export async function requestPasswordResetCodeFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const parsedBody = requestPasswordResetCodeRequestSchema.safeParse(fastifyRequest.body);
  if (!parsedBody.success) throw new ValidationError();
  await requestPasswordResetCode({ emailAddress: parsedBody.data.emailAddress }, {
    error: (context, message) => fastifyRequest.log.error(context, message),
  });
  return fastifyReply.code(202).send({ message: AUTH_RESPONSE_MESSAGES.passwordResetRequested });
}

export async function verifyPasswordResetCodeFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const parsedBody = verifyPasswordResetCodeRequestSchema.safeParse(fastifyRequest.body);
  if (!parsedBody.success) throw new ValidationError();
  const resetSession = await verifyPasswordResetCode({
    emailAddress: parsedBody.data.emailAddress,
    oneTimeCode: parsedBody.data.oneTimeCode,
  });
  return fastifyReply.code(200).send(resetSession);
}

export async function resetAccountPasswordFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const parsedBody = resetAccountPasswordRequestSchema.safeParse(fastifyRequest.body);
  if (!parsedBody.success) throw new ValidationError();
  await resetAccountPassword({ resetToken: parsedBody.data.resetToken, newPlainTextPassword: parsedBody.data.newPassword });
  return fastifyReply.code(200).send({ message: AUTH_RESPONSE_MESSAGES.passwordResetCompleted });
}
