import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { applicationEnvironment } from '../configs/env.config.js';

const postgresPrismaAdapter = new PrismaPg({ connectionString: applicationEnvironment.databaseUrl });

export const prismaDatabaseClient = new PrismaClient({ adapter: postgresPrismaAdapter });

export async function verifyPrismaDatabaseConnection(): Promise<void> {
  await prismaDatabaseClient.$queryRaw`SELECT 1`;
}

export async function disconnectPrismaDatabaseClient(): Promise<void> {
  await prismaDatabaseClient.$disconnect();
}
