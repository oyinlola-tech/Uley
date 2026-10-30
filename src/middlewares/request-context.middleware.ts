import type { FastifyInstance } from 'fastify';

export async function registerRequestContextMiddleware(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.addHook('onRequest', async (fastifyRequest) => {
    fastifyRequest.log.info({ requestId: fastifyRequest.id }, 'Incoming API request');
  });
}
