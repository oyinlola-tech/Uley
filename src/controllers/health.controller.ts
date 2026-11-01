import type { FastifyReply, FastifyRequest } from 'fastify';
import { HttpStatusCode } from '../enums/httpStatusCode.enum.js';
import { verifyPrismaDatabaseConnection } from '../database/prisma.database.js';
import type {
  ApiLivenessResponse,
  ApiReadinessResponse,
  ApiUnavailableResponse,
} from '../interfaces/health.interface.js';

export function getApiLivenessStatus(
  _fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): FastifyReply {
  const apiLivenessResponse: ApiLivenessResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  return fastifyReply.code(HttpStatusCode.OK).send(apiLivenessResponse);
}

export async function getApiReadinessStatus(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  let postgresDatabaseConnectionIsAvailable = false;
  let postgresDatabaseConnectionError: unknown;

  try {
    await verifyPrismaDatabaseConnection();
    postgresDatabaseConnectionIsAvailable = true;
  } catch (databaseConnectionError) {
    postgresDatabaseConnectionError = databaseConnectionError;
  }

  if (!postgresDatabaseConnectionIsAvailable) {
    fastifyRequest.log.error(
      { err: postgresDatabaseConnectionError },
      'API readiness check could not connect to PostgreSQL',
    );
    const apiUnavailableResponse: ApiUnavailableResponse = {
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      dependencies: { postgresDatabase: 'unavailable' },
    };
    return fastifyReply.code(HttpStatusCode.SERVICE_UNAVAILABLE).send(apiUnavailableResponse);
  }

  const apiReadinessResponse: ApiReadinessResponse = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    dependencies: { postgresDatabase: 'available' },
  };
  return fastifyReply.code(HttpStatusCode.OK).send(apiReadinessResponse);
}
