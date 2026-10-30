import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health.routes.js';

export async function registerApplicationRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  await fastifyApplication.register(registerHealthRoutes, { prefix: '/api/v1' });
}
