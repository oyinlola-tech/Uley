import { ConversationType, UserRole } from '@prisma/client';
import { startConversation } from '../../conversations/index.js';
import { prismaDatabaseClient } from '../../../database/prisma.database.js';
import { NotFoundError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';

export async function contactUserAdvertisementOwner(input: { advertisementId: string; userId: string; userRole: UserRole }) {
  const now = new Date();
  const ad = await prismaDatabaseClient.userAdvertisement.findFirst({ where: { id: input.advertisementId, status: 'APPROVED', paymentConfirmedAt: { not: null }, startsAt: { lte: now }, endsAt: { gt: now }, advertiser: { isActive: true } }, select: { id: true, title: true, advertiserId: true } });
  if (!ad || ad.advertiserId === input.userId || !([UserRole.STUDENT, UserRole.LANDLORD, UserRole.BUSINESS_ADVERTISER] as UserRole[]).includes(input.userRole)) throw new NotFoundError(ERROR_MESSAGES.userAdvertisementUnavailable);
  return startConversation({ userId: input.userId, userRole: input.userRole, type: ConversationType.DIRECT, targetUserId: ad.advertiserId, subject: `Ad inquiry: ${ad.title.slice(0, 100)}` });
}
