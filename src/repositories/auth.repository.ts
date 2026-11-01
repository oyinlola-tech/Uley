import { PrismaClient, UniversityOwnership } from '@prisma/client';
import type { UserRole } from '../enums/userRole.enum.js';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { createHash } from 'node:crypto';
import type { UnlistedUniversityDto } from '../dtos/unlistedUniversity.dto.js';
import { UNLISTED_UNIVERSITY_SLUG_PREFIX } from '../constants/university.constant.js';

export interface CreateAuthSessionInput {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export class AuthRepository {
  constructor(private readonly databaseClient: PrismaClient = prismaDatabaseClient) {}

  async createRegisteredUser(input: {
    email: string;
    fullName: string;
    passwordHash: string;
    role: UserRole;
    universityId?: string;
    unlistedUniversity?: UnlistedUniversityDto;
    businessProfile?: { businessName: string; category: string; city: string; websiteUrl?: string };
  }) {
    return this.databaseClient.$transaction(async (transaction) => {
      let universityId = input.universityId;
      if (input.unlistedUniversity) {
        const requested = input.unlistedUniversity;
        const requestKey = createHash('sha256').update(`${requested.name}|${requested.city}|${requested.state}`.toLowerCase()).digest('hex').slice(0, 20);
        const requestedUniversity = await transaction.university.upsert({
          where: { slug: `${UNLISTED_UNIVERSITY_SLUG_PREFIX}-${requestKey}` },
          create: { slug: `${UNLISTED_UNIVERSITY_SLUG_PREFIX}-${requestKey}`, name: requested.name, city: requested.city, state: requested.state, ownership: UniversityOwnership.UNCLASSIFIED, isActive: false, isRequested: true },
          update: { isRequested: true },
          select: { id: true },
        });
        universityId = requestedUniversity.id;
      } else if (input.role !== 'BUSINESS_ADVERTISER' && input.role !== 'CARETAKER') {
        if (!input.universityId) return null;
        const university = await transaction.university.findFirst({
          where: { id: input.universityId, isActive: true, ownership: { in: [UniversityOwnership.FEDERAL, UniversityOwnership.STATE] } },
          select: { id: true },
        });
        if (!university) return null;
        universityId = university.id;
      }
      return transaction.user.create({ data: { email: input.email, fullName: input.fullName, passwordHash: input.passwordHash, role: input.role, ...(universityId ? { university: { connect: { id: universityId } } } : {}), profile: { create: {} }, ...(input.businessProfile ? { businessAdvertiserProfile: { create: input.businessProfile } } : {}) } });
    });
  }

  async findUserByEmail(emailAddress: string) {
    return this.databaseClient.user.findUnique({ where: { email: emailAddress } });
  }

  async findActiveUserById(userId: string) {
    return this.databaseClient.user.findFirst({ where: { id: userId, isActive: true } });
  }

  async createAuthSession(input: CreateAuthSessionInput) {
    return this.databaseClient.authSession.create({ data: input });
  }

  async findActiveSessionByRefreshTokenHash(refreshTokenHash: string) {
    return this.databaseClient.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      include: { user: true },
    });
  }

  async rotateAuthSession(input: {
    oldSessionId: string;
    newRefreshTokenHash: string;
    newExpiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<boolean> {
    return this.databaseClient.$transaction(async (transactionClient) => {
      const revocationResult = await transactionClient.authSession.updateMany({
        where: {
          id: input.oldSessionId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date(), lastUsedAt: new Date() },
      });
      if (revocationResult.count !== 1) return false;

      const oldSession = await transactionClient.authSession.findUnique({
        where: { id: input.oldSessionId },
        select: { userId: true },
      });
      if (!oldSession) return false;

      await transactionClient.authSession.create({
        data: {
          userId: oldSession.userId,
          refreshTokenHash: input.newRefreshTokenHash,
          expiresAt: input.newExpiresAt,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
      });
      return true;
    });
  }

  async revokeAuthSession(authSessionId: string, userId: string): Promise<void> {
    await this.databaseClient.authSession.updateMany({
      where: { id: authSessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findActiveAuthSession(authSessionId: string, userId: string) {
    return this.databaseClient.authSession.findFirst({
      where: {
        id: authSessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      include: { user: true },
    });
  }

  async revokeAllAuthSessionsForUser(userId: string): Promise<void> {
    await this.databaseClient.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updatePasswordAndRevokeSessions(userId: string, passwordHash: string): Promise<void> {
    await this.databaseClient.$transaction(async (transactionClient) => {
      await transactionClient.user.update({ where: { id: userId }, data: { passwordHash } });
      await transactionClient.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

}
