import Fastify, { type FastifyInstance } from 'fastify';
import { applicationEnvironment } from './configs/env.config.js';
import { APPLICATION_MESSAGES } from './constants/appMessage.constant.js';
import { AppError } from './errors/app.error.js';
import { registerApplicationLoaders } from './loaders/index.js';

export async function createFastifyApplication(): Promise<FastifyInstance> {
  const fastifyApplication = Fastify({ logger: { level: applicationEnvironment.logLevel } });
  await registerApplicationLoaders(fastifyApplication);

  fastifyApplication.setErrorHandler((applicationError, fastifyRequest, fastifyReply) => {
    fastifyRequest.log.error({ err: applicationError }, 'Request failed');
    if (applicationError instanceof AppError) {
      return fastifyReply.code(applicationError.statusCode).send({
        error: { code: applicationError.code, message: applicationError.message },
      });
    }
    return fastifyReply.code(500).send({
      error: { code: 'INTERNAL_SERVER_ERROR', message: APPLICATION_MESSAGES.INTERNAL_SERVER_ERROR },
    });
  });

  return fastifyApplication;
}
