import type { FastifyReply, FastifyRequest } from 'fastify';
import { registerBusinessAdvertiser } from '../services/auth/index.js';
import { registerBusinessAdvertiserRequestSchema } from '../validations/auth.validation.js';
import { ValidationError } from '../errors/app.error.js';

export async function registerBusinessAdvertiserFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const result = registerBusinessAdvertiserRequestSchema.safeParse(request.body);
  if (!result.success) throw new ValidationError(result.error.issues[0]?.message);
  const { password, websiteUrl, ...details } = result.data;
  const advertiser = await registerBusinessAdvertiser({ ...details, plainTextPassword: password, ...(websiteUrl ? { websiteUrl } : {}) });
  return reply.code(201).send({ authenticatedUser: advertiser });
}
