import { createFastifyApplication } from './app.js';
import { applicationEnvironment } from './configs/env.config.js';
import { disconnectPrismaDatabaseClient } from './database/prisma.database.js';

export async function startFastifyHttpServer(): Promise<void> {
  const fastifyApplication = await createFastifyApplication();
  try {
    await fastifyApplication.listen({ host: applicationEnvironment.host, port: applicationEnvironment.port });
  } catch (serverStartupError) {
    fastifyApplication.log.error(serverStartupError, 'Fastify HTTP server failed to start');
    await fastifyApplication.close();
    process.exitCode = 1;
    return;
  }

  const gracefullyShutDownFastifyHttpServer = async (shutdownSignal: string): Promise<void> => {
    fastifyApplication.log.info({ shutdownSignal }, 'Gracefully shutting down Fastify HTTP server');
    await fastifyApplication.close();
    await disconnectPrismaDatabaseClient();
  };
  process.once('SIGINT', () => void gracefullyShutDownFastifyHttpServer('SIGINT'));
  process.once('SIGTERM', () => void gracefullyShutDownFastifyHttpServer('SIGTERM'));
}
