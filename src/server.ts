import { createFastifyApplication } from './app.js';
import { applicationEnvironment } from './configs/env.config.js';
import { closePostgresDatabaseConnection } from './database/postgres.database.js';

export async function startFastifyHttpServer(): Promise<void> {
  const fastifyApplication = await createFastifyApplication();
  try {
    await fastifyApplication.listen({ host: applicationEnvironment.host, port: applicationEnvironment.port });
  } catch (error) {
    fastifyApplication.log.error(error, 'Server failed to start');
    await fastifyApplication.close();
    process.exitCode = 1;
    return;
  }

  const gracefullyShutDownServer = async (signal: string): Promise<void> => {
    fastifyApplication.log.info({ signal }, 'Shutting down server');
    await fastifyApplication.close();
    await closePostgresDatabaseConnection();
  };
  process.once('SIGINT', () => void gracefullyShutDownServer('SIGINT'));
  process.once('SIGTERM', () => void gracefullyShutDownServer('SIGTERM'));
}
