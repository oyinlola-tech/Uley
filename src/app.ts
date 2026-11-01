import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';
import fastifyRawBody from 'fastify-raw-body';
import fastifyWebsocket from '@fastify/websocket';
import { applicationEnvironment } from './configs/env.config.js';
import { ERROR_MESSAGES, AppError, ErrorCode } from './errors/index.js';
import { HttpStatusCode } from './enums/httpStatusCode.enum.js';
import { registerApplicationLoaders } from './loaders/index.js';
import { prismaDatabaseClient } from './database/prisma.database.js';
import { SystemLogEventType } from './enums/systemLogEventType.enum.js';
import { SystemLogLevel } from './enums/systemLogLevel.enum.js';
import { writeSystemLogEntry } from './utils/systemLog.writer.js';
import { registerRequestContextMiddleware } from './middlewares/requestContext.middleware.js';
import { initializeConversationRealtimeListener } from './services/conversations/index.js';
import { startComplaintVideoScanQueue, startPropertyImageScanQueue } from './services/mediaScanning/index.js';
import { startPushNotificationWorker } from './services/notifications/index.js';
import { startExpiredPropertyImageUploadCleanup } from './services/mediaScanning/index.js';

export async function createFastifyApplication(): Promise<FastifyInstance> {
  const fastifyApplication = Fastify({ logger: { level: applicationEnvironment.logLevel } });
  fastifyApplication.setErrorHandler(async (applicationError, fastifyRequest, fastifyReply) => {
    fastifyRequest.log.error({ err: applicationError }, 'Request failed');
    const statusCode = applicationError instanceof AppError ? applicationError.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
    const isAccessDenied = statusCode === HttpStatusCode.UNAUTHORIZED || statusCode === HttpStatusCode.FORBIDDEN;
    const isFailedMutation = fastifyRequest.method !== 'GET' && statusCode >= 400;
    if (statusCode >= 500 || isAccessDenied || isFailedMutation) {
      void writeSystemLogEntry(prismaDatabaseClient, {
        eventType: isAccessDenied ? SystemLogEventType.API_ACCESS_DENIED : SystemLogEventType.API_REQUEST_FAILED,
        level: statusCode >= 500 ? SystemLogLevel.ERROR : SystemLogLevel.WARNING,
        summary: statusCode >= 500 ? 'An API request failed unexpectedly.' : isAccessDenied ? 'An API request was denied.' : 'An API action was rejected.',
        requestId: fastifyRequest.id,
        ...(fastifyRequest.authenticatedUser?.id ? { actorId: fastifyRequest.authenticatedUser.id } : {}),
        method: fastifyRequest.method,
        ...(fastifyRequest.routeOptions.url ? { route: fastifyRequest.routeOptions.url } : {}),
        statusCode,
        errorCode: applicationError instanceof AppError ? applicationError.code : ErrorCode.INTERNAL_SERVER_ERROR,
        metadata: { errorType: applicationError instanceof Error ? applicationError.name : 'UnknownError' },
      }).catch((logWriteError: unknown) => {
        fastifyRequest.log.error({ requestId: fastifyRequest.id, err: logWriteError }, 'Could not persist the request failure log');
      });
    }
    if (applicationError instanceof AppError) {
      return fastifyReply.code(applicationError.statusCode).send({
        error: { code: applicationError.code, message: applicationError.message },
        requestId: fastifyRequest.id,
      });
    }
    return fastifyReply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send({
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: ERROR_MESSAGES.internalServerError },
      requestId: fastifyRequest.id,
    });
  });

  fastifyApplication.decorateRequest('authenticatedUser', null);
  fastifyApplication.decorateRequest('authSessionId', null);
  await fastifyApplication.register(fastifyCookie);
  await fastifyApplication.register(fastifyRawBody, { global: false, encoding: false, runFirst: true });
  await fastifyApplication.register(fastifyRateLimit, { global: false });
  await fastifyApplication.register(fastifyWebsocket, { options: { maxPayload: 8192, perMessageDeflate: false } });
  await fastifyApplication.register(fastifyMultipart, { limits: { files: 1, fileSize: 10 * 1024 * 1024 } });
  await registerRequestContextMiddleware(fastifyApplication);
  initializeConversationRealtimeListener(fastifyApplication);
  await registerApplicationLoaders(fastifyApplication);
  startPropertyImageScanQueue(fastifyApplication);
  startComplaintVideoScanQueue(fastifyApplication);
  startPushNotificationWorker(fastifyApplication.log, (cleanup) => fastifyApplication.addHook('onClose', cleanup));
  startExpiredPropertyImageUploadCleanup(fastifyApplication);

  return fastifyApplication;
}
