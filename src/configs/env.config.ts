import 'dotenv/config';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getPositiveIntegerEnvironmentVariable(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}

export const applicationEnvironment = {
  nodeEnv: nodeEnv as 'development' | 'test' | 'production',
  host: process.env.HOST ?? '0.0.0.0',
  port: getPositiveIntegerEnvironmentVariable('PORT', 3000),
  databaseUrl: getRequiredEnvironmentVariable('DATABASE_URL'),
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;
