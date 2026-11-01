import type { FastifyReply, FastifyRequest } from 'fastify';
import { registerCaretakerAccount } from '../services/auth/index.js';
import { registerCaretakerRequestSchema } from '../validations/auth.validation.js';
import { ValidationError } from '../errors/app.error.js';

export async function registerCaretakerAccountFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const registrationData = registerCaretakerRequestSchema.safeParse(request.body);
  if (!registrationData.success) throw new ValidationError(registrationData.error.issues[0]?.message);
  const registeredCaretaker = await registerCaretakerAccount({
    emailAddress: registrationData.data.emailAddress,
    fullName: registrationData.data.fullName,
    plainTextPassword: registrationData.data.password,
  });
  return reply.code(201).send({ authenticatedUser: registeredCaretaker });
}
