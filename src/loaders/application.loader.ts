import type { FastifyInstance } from 'fastify';
import { registerApplicationRoutes } from '../routes/application.routes.js';

export async function registerApplicationLoaders(fastifyApplication: FastifyInstance): Promise<void> {
  await registerApplicationRoutes(fastifyApplication);
}
