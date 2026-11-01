import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UniversityOwnership, UserRole } from '@prisma/client';
import { SUPER_ADMIN_SEED_LIMITS } from '../src/constants/superAdminSeed.constant.js';
import { hashAccountPassword } from '../src/utils/password.js';
import { PILOT_UNIVERSITY } from '../src/constants/pilotUniversity.constant.js';
import { NIGERIAN_PUBLIC_UNIVERSITIES } from '../src/constants/nigerianPublicUniversities.constant.js';

function getSeedValue(variableName: string): string {
  const value = process.env[variableName]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${variableName}`);
  return value;
}

async function provisionFirstSuperAdministrator(): Promise<void> {
  const email = getSeedValue('SUPER_ADMIN_EMAIL').toLowerCase();
  const fullName = getSeedValue('SUPER_ADMIN_NAME');
  const password = getSeedValue('SUPER_ADMIN_PASSWORD');
  const databaseUrl = getSeedValue('DATABASE_URL');
  if (email.length > SUPER_ADMIN_SEED_LIMITS.emailMaximumLength || !email.includes('@')) throw new Error('SUPER_ADMIN_EMAIL must be a valid email address.');
  if (fullName.length > SUPER_ADMIN_SEED_LIMITS.fullNameMaximumLength) throw new Error('SUPER_ADMIN_NAME is too long.');
  if (password.length < SUPER_ADMIN_SEED_LIMITS.passwordMinimumLength) throw new Error('SUPER_ADMIN_PASSWORD must be at least 16 characters long.');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    for (const university of NIGERIAN_PUBLIC_UNIVERSITIES) {
      const ownership = university.ownership === 'Federal' ? UniversityOwnership.FEDERAL : UniversityOwnership.STATE;
      await prisma.university.upsert({
        where: { slug: university.slug },
        create: { ...university, ownership, isActive: true, isPilot: university.slug === PILOT_UNIVERSITY.slug },
        update: { ...university, ownership, isActive: true, isPilot: university.slug === PILOT_UNIVERSITY.slug },
      });
    }
    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing) {
      if (existing.role !== UserRole.SUPER_ADMIN) throw new Error('The configured super admin email belongs to a different account role.');
      return;
    }
    await prisma.user.create({ data: { email, fullName, passwordHash: await hashAccountPassword(password), role: UserRole.SUPER_ADMIN } });
  } finally {
    await prisma.$disconnect();
  }
}

await provisionFirstSuperAdministrator();
