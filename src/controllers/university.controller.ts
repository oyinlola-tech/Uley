import type { FastifyReply, FastifyRequest } from 'fastify';
import { listUniversitiesAcceptingRegistration } from '../services/universities/index.js';

export async function getRegistrationUniversities(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ universities: await listUniversitiesAcceptingRegistration() });
}
