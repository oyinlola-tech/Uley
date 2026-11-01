import type { FastifyInstance } from 'fastify';

export async function registerRequestContextMiddleware(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.addHook('onSend', async (fastifyRequest, fastifyReply, payload) => {
    fastifyReply.header('x-request-id', fastifyRequest.id);
    return payload;
  });
  fastifyApplication.addHook('onRequest', async (fastifyRequest) => {
    fastifyRequest.log.info({ requestId: fastifyRequest.id }, 'Incoming API request');
  });
}
