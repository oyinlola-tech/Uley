import type { FastifyInstance } from 'fastify';
import { verifyPostgresDatabaseConnection } from '../database/postgres.database.js';
import { registerApplicationRoutes } from '../routes/index.js';

export async function registerApplicationLoaders(fastifyApplication: FastifyInstance): Promise<void> {
  await verifyPostgresDatabaseConnection();
  await registerApplicationRoutes(fastifyApplication);
}
