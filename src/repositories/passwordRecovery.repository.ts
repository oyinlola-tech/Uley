import { PrismaClient } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';

export class PasswordRecoveryRepository {
  constructor(private readonly databaseClient: PrismaClient = prismaDatabaseClient) {}

  findPasswordResetCooldownRecord(emailAddress: string, createdAfter: Date) {
    return this.databaseClient.passwordResetChallenge.findFirst({
      where: { emailAddress, createdAt: { gt: createdAfter } }, orderBy: { createdAt: 'desc' }, select: { id: true },
    });
  }

  async consumePreviousPasswordResetChallenges(emailAddress: string, consumedAt: Date): Promise<void> {
    await this.databaseClient.passwordResetChallenge.updateMany({
      where: { emailAddress, consumedAt: null }, data: { consumedAt, resetTokenHash: null, resetTokenExpiresAt: null },
    });
  }

  createPasswordResetChallenge(input: { emailAddress: string; codeHash: string; expiresAt: Date }) {
    return this.databaseClient.passwordResetChallenge.create({ data: input });
  }

  async consumePasswordResetChallenge(challengeId: string, consumedAt: Date): Promise<void> {
    await this.databaseClient.passwordResetChallenge.updateMany({
      where: { id: challengeId, consumedAt: null }, data: { consumedAt, resetTokenHash: null, resetTokenExpiresAt: null },
    });
  }

  findActivePasswordResetChallenge(emailAddress: string, currentTime: Date) {
    return this.databaseClient.passwordResetChallenge.findFirst({
      where: { emailAddress, consumedAt: null, expiresAt: { gt: currentTime }, attemptCount: { lt: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementPasswordResetChallengeAttempts(challengeId: string, currentTime: Date): Promise<boolean> {
    const result = await this.databaseClient.passwordResetChallenge.updateMany({
      where: { id: challengeId, consumedAt: null, expiresAt: { gt: currentTime }, attemptCount: { lt: 5 } },
      data: { attemptCount: { increment: 1 } },
    });
    return result.count === 1;
  }

  async issuePasswordResetToken(input: { challengeId: string; tokenHash: string; expiresAt: Date }): Promise<boolean> {
    const result = await this.databaseClient.passwordResetChallenge.updateMany({
      where: { id: input.challengeId, consumedAt: null, expiresAt: { gt: new Date() }, attemptCount: { lte: 5 } },
      data: { consumedAt: new Date(), resetTokenHash: input.tokenHash, resetTokenExpiresAt: input.expiresAt },
    });
    return result.count === 1;
  }

  updatePasswordFromResetToken(tokenHash: string, passwordHash: string, currentTime: Date): Promise<boolean> {
    return this.databaseClient.$transaction(async (transactionClient) => {
      const challenge = await transactionClient.passwordResetChallenge.findFirst({ where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: currentTime } } });
      if (!challenge) return false;
      const consumed = await transactionClient.passwordResetChallenge.updateMany({
        where: { id: challenge.id, resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: currentTime } }, data: { resetTokenHash: null, resetTokenExpiresAt: null },
      });
      if (consumed.count !== 1) return false;
      const account = await transactionClient.user.updateMany({ where: { email: challenge.emailAddress, isActive: true }, data: { passwordHash } });
      if (account.count !== 1) return false;
      await transactionClient.authSession.updateMany({ where: { user: { email: challenge.emailAddress }, revokedAt: null }, data: { revokedAt: currentTime } });
      return true;
    });
  }
}
