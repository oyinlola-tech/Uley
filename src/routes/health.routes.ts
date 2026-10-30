import type { FastifyInstance } from 'fastify';
import { getApiHealthStatus } from '../controllers/health.controller.js';

export async function registerHealthRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.get('/health', getApiHealthStatus);
}
