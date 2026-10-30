import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyPostgresDatabaseConnection } from '../database/postgres.database.js';
import type { ApiHealthStatus } from '../interfaces/health.interface.js';

export async function getApiHealthStatus(
  _fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  await verifyPostgresDatabaseConnection();
  const apiHealthStatus: ApiHealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'ok',
  };
  return fastifyReply.code(200).send(apiHealthStatus);
}
