import { MessageAppealStatus, MessageModerationStatus, NotificationType } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function createMessageModerationAppeal(input: { messageId: string; senderId: string; reason: string }) {
  const message = await prismaDatabaseClient.conversationMessage.findFirst({ where: { id: input.messageId, senderId: input.senderId, moderationStatus: MessageModerationStatus.REJECTED }, select: { id: true } });
  if (!message) throw new NotFoundError(ERROR_MESSAGES.messageAppealUnavailable);
  try {
    return await prismaDatabaseClient.messageModerationAppeal.create({ data: { messageId: message.id, senderId: input.senderId, reason: input.reason }, select: { id: true, status: true, reason: true, createdAt: true } });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new ConflictError(ERROR_MESSAGES.messageAppealAlreadySubmitted);
    throw error;
  }
}

export function listPendingMessageModerationAppeals() {
  return prismaDatabaseClient.messageModerationAppeal.findMany({ where: { status: MessageAppealStatus.PENDING }, orderBy: { createdAt: 'asc' }, take: 100,
    include: { sender: { select: { id: true, fullName: true, email: true } }, message: { select: { id: true, body: true, createdAt: true, conversation: { select: { id: true, type: true, subject: true } } } } },
  });
}

export async function decideMessageModerationAppeal(input: { appealId: string; reviewerId: string; decision: 'OVERTURNED' | 'UPHELD'; reviewNote: string; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const appeal = await transaction.messageModerationAppeal.findFirst({ where: { id: input.appealId, status: MessageAppealStatus.PENDING }, include: { message: true } });
    if (!appeal || appeal.senderId === input.reviewerId) throw new NotFoundError(ERROR_MESSAGES.messageAppealUnavailable);
    if (appeal.message.moderationStatus !== MessageModerationStatus.REJECTED) throw new ConflictError(ERROR_MESSAGES.messageAppealUnavailable);
    if (appeal.message.moderationReviewerId === input.reviewerId) throw new ConflictError(ERROR_MESSAGES.messageAppealRequiresIndependentReviewer);
    const status = input.decision === 'OVERTURNED' ? MessageAppealStatus.OVERTURNED : MessageAppealStatus.UPHELD;
    const changed = await transaction.messageModerationAppeal.updateMany({ where: { id: appeal.id, status: MessageAppealStatus.PENDING }, data: { status, reviewerId: input.reviewerId, reviewNote: input.reviewNote, reviewedAt: new Date() } });
    if (!changed.count) throw new ConflictError(ERROR_MESSAGES.messageAppealUnavailable);
    await transaction.notification.create({ data: {
      recipientId: appeal.senderId, type: NotificationType.MESSAGE_APPEAL_DECISION,
      title: status === MessageAppealStatus.OVERTURNED ? 'Message appeal accepted' : 'Message appeal reviewed',
      message: status === MessageAppealStatus.OVERTURNED ? 'Your message can now be seen by the other conversation participants.' : ('The moderator upheld the original decision. ' + input.reviewNote).slice(0, 500),
      href: '/messages', deduplicationKey: 'message-appeal:' + appeal.id + ':decision',
    } });
    if (status === MessageAppealStatus.OVERTURNED) {
      const message = await transaction.conversationMessage.update({ where: { id: appeal.messageId }, data: { moderationStatus: MessageModerationStatus.APPROVED, moderationReason: null }, include: { sender: { select: { fullName: true } } } });
      const recipients = await transaction.conversationParticipant.findMany({ where: { conversationId: message.conversationId, userId: { not: message.senderId }, leftAt: null }, select: { userId: true } });
      await transaction.notification.createMany({ data: recipients.map(({ userId }) => ({ recipientId: userId, type: NotificationType.MESSAGE_RECEIVED, title: 'New message', message: message.sender.fullName + ' sent you a message.', href: '/messages', deduplicationKey: 'message:' + message.id + ':recipient:' + userId })), skipDuplicates: true });
      await transaction.$queryRaw`SELECT pg_notify('uley_conversation_events', ${JSON.stringify({ conversationId: message.conversationId, messageId: message.id })})`;
    }
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'MESSAGE_APPEAL', targetId: appeal.id, summary: 'A rejected conversation message appeal was decided.', metadata: { decision: status } } });
    return transaction.messageModerationAppeal.findUniqueOrThrow({ where: { id: appeal.id }, include: { sender: { select: { fullName: true } }, message: { select: { body: true, moderationStatus: true } } } });
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
