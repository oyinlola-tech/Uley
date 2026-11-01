import { prismaDatabaseClient } from '../database/prisma.database.js';
import { UniversityOwnership } from '@prisma/client';

export async function findUniversitiesAcceptingRegistration() {
  return prismaDatabaseClient.university.findMany({
    where: { isActive: true, ownership: { in: [UniversityOwnership.FEDERAL, UniversityOwnership.STATE] } }, orderBy: { name: 'asc' },
    select: { id: true, name: true, city: true, state: true },
  });
}
