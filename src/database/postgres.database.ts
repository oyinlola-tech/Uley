import { Pool } from 'pg';
import { applicationEnvironment } from '../configs/env.config.js';

export const postgresConnectionPool = new Pool({
  connectionString: applicationEnvironment.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

postgresConnectionPool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error', error);
});

export async function verifyPostgresDatabaseConnection(): Promise<void> {
  const postgresClient = await postgresConnectionPool.connect();
  try {
    await postgresClient.query('SELECT 1');
  } finally {
    postgresClient.release();
  }
}

export async function closePostgresDatabaseConnection(): Promise<void> {
  await postgresConnectionPool.end();
}
