import { ConversationType, FlatmatePostStatus, MessageModerationStatus, NotificationType, PropertyStatus, UserRole, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { CONVERSATION_LIMITS } from '../constants/conversation.constant.js';
import { ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { assessChatMessage } from '../utils/chatModeration.js';

const participantDetails = { user: { select: { id: true, fullName: true, role: true } } };

export async function createOrFindConversation(input: { userId: string; userRole: UserRole; type: ConversationType; propertyId?: string; flatmatePostId?: string; targetUserId?: string; subject?: string }) {
  const participants = await resolveConversationParticipants(input);
  if (!participants || participants.length < 2) throw new NotFoundError(ERROR_MESSAGES.conversationUnavailable);
  const existing = await prismaDatabaseClient.conversation.findFirst({
    where: { type: input.type, ...(input.propertyId ? { propertyId: input.propertyId } : {}), ...(input.flatmatePostId ? { flatmatePostId: input.flatmatePostId } : {}), participants: { every: { userId: { in: participants } } } },
    include: { participants: { include: participantDetails }, messages: { where: { moderationStatus: MessageModerationStatus.APPROVED }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (existing) return existing;
  await enforceConversationStartRateLimit(input.userId);
  if (input.type === ConversationType.FLATMATE) await enforceFlatmateConversationCooldown(input.userId);
  return prismaDatabaseClient.conversation.create({
    data: { type: input.type, createdById: input.userId, ...(input.propertyId ? { propertyId: input.propertyId } : {}), ...(input.flatmatePostId ? { flatmatePostId: input.flatmatePostId } : {}), ...(input.subject ? { subject: input.subject } : {}), participants: { create: participants.map((userId) => ({ userId })) } },
    include: { participants: { include: participantDetails }, messages: true },
  });
}

async function enforceConversationStartRateLimit(userId: string) {
  const since = new Date(Date.now() - CONVERSATION_LIMITS.conversationStartRateLimitWindowMilliseconds);
  const recentStarts = await prismaDatabaseClient.conversation.count({ where: { createdById: userId, createdAt: { gte: since } } });
  if (recentStarts >= CONVERSATION_LIMITS.conversationStartRateLimitMaximum) throw new TooManyRequestsError(ERROR_MESSAGES.flatmateContactCooldown);
}

async function enforceFlatmateConversationCooldown(userId: string) {
  const now = Date.now();
  const cooldownStart = new Date(now - CONVERSATION_LIMITS.flatmateConversationCooldownMilliseconds);
  const recentConversation = await prismaDatabaseClient.conversation.findFirst({ where: { type: ConversationType.FLATMATE, createdById: userId, createdAt: { gt: cooldownStart } }, select: { id: true } });
  if (recentConversation) throw new TooManyRequestsError(ERROR_MESSAGES.flatmateContactCooldown);
  const recentFlatmateStarts = await prismaDatabaseClient.conversation.count({ where: { type: ConversationType.FLATMATE, createdById: userId, createdAt: { gte: new Date(now - CONVERSATION_LIMITS.flatmateContactRateLimitWindowMilliseconds) } } });
  if (recentFlatmateStarts >= CONVERSATION_LIMITS.flatmateContactRateLimitMaximum) throw new TooManyRequestsError(ERROR_MESSAGES.flatmateContactCooldown);
}

async function resolveConversationParticipants(input: { userId: string; userRole: UserRole; type: ConversationType; propertyId?: string; flatmatePostId?: string; targetUserId?: string }) {
  if (input.type === ConversationType.LANDLORD_STUDENT && input.propertyId && input.userRole === UserRole.STUDENT) {
    const property = await prismaDatabaseClient.property.findFirst({ where: { id: input.propertyId, status: PropertyStatus.PUBLISHED, verification: { is: { status: VerificationStatus.APPROVED } }, landlord: { isActive: true, landlordVerification: { is: { status: VerificationStatus.APPROVED } } } }, select: { landlordId: true } });
    return property ? [input.userId, property.landlordId] : null;
  }
  if (input.type === ConversationType.SUPPORT && (input.userRole === UserRole.STUDENT || input.userRole === UserRole.LANDLORD)) {
    const moderator = await prismaDatabaseClient.user.findFirst({ where: { isActive: true, role: { in: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] } }, orderBy: { createdAt: 'asc' }, select: { id: true } });
    return moderator ? [input.userId, moderator.id] : null;
  }
  if (input.type === ConversationType.FLATMATE && input.flatmatePostId && input.userRole === UserRole.STUDENT) {
    const post = await prismaDatabaseClient.flatmatePost.findFirst({ where: { id: input.flatmatePostId, status: FlatmatePostStatus.ACTIVE }, select: { studentId: true } });
    return post && post.studentId !== input.userId ? [input.userId, post.studentId] : null;
  }
  if (input.type === ConversationType.DIRECT && input.targetUserId && input.targetUserId !== input.userId && (input.userRole === UserRole.STUDENT || input.userRole === UserRole.LANDLORD)) {
    const target = await prismaDatabaseClient.user.findFirst({ where: { id: input.targetUserId, isActive: true, role: { in: [UserRole.STUDENT, UserRole.LANDLORD] }, profile: { is: { isDiscoverable: true } } }, select: { id: true } });
    const blocked = await prismaDatabaseClient.userBlock.findFirst({ where: { OR: [{ blockerId: input.userId, blockedUserId: input.targetUserId }, { blockerId: input.targetUserId, blockedUserId: input.userId }] }, select: { id: true } });
    return target && !blocked ? [input.userId, target.id] : null;
  }
  return null;
}

export async function listUserConversations(userId: string) {
  const blockedUsers = await prismaDatabaseClient.userBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] }, select: { blockerId: true, blockedUserId: true } });
  const blockedIds = blockedUsers.map((block) => block.blockerId === userId ? block.blockedUserId : block.blockerId);
  const conversations = await prismaDatabaseClient.conversation.findMany({ where: { participants: { some: { userId, leftAt: null } } }, take: CONVERSATION_LIMITS.conversationsPerPage, orderBy: { lastMessageAt: 'desc' }, include: { participants: { include: participantDetails }, property: { select: { id: true, name: true } }, flatmatePost: { select: { id: true, city: true } }, messages: { where: { moderationStatus: MessageModerationStatus.APPROVED }, orderBy: { createdAt: 'desc' }, take: 1 } } });
  return conversations.filter((conversation) => !conversation.participants.some((participant) => participant.userId !== userId && blockedIds.includes(participant.userId)));
}

export async function listConversationMessages(input: { conversationId: string; userId: string; after?: Date }) {
  await requireConversationParticipant(input.conversationId, input.userId);
  const messages = await prismaDatabaseClient.conversationMessage.findMany({ where: { conversationId: input.conversationId, OR: [{ moderationStatus: MessageModerationStatus.APPROVED }, { senderId: input.userId, moderationStatus: { in: [MessageModerationStatus.REVIEW, MessageModerationStatus.REJECTED] } }], ...(input.after ? { createdAt: { gt: input.after } } : {}) }, orderBy: { createdAt: input.after ? 'asc' : 'desc' }, take: CONVERSATION_LIMITS.messagesPerPage, include: { sender: { select: { id: true, fullName: true } }, moderationAppeal: { select: { id: true, status: true, reviewNote: true } } } });
  return input.after ? messages : messages.reverse();
}

export async function markConversationRead(input: { conversationId: string; userId: string }) {
  await requireConversationParticipant(input.conversationId, input.userId);
  return prismaDatabaseClient.conversationParticipant.update({ where: { conversationId_userId: { conversationId: input.conversationId, userId: input.userId } }, data: { lastReadAt: new Date() } });
}

export async function sendConversationMessage(input: { conversationId: string; senderId: string; body: string }) {
  await requireConversationParticipant(input.conversationId, input.senderId);
  const assessment = assessChatMessage(input.body);
  const blocked = await prismaDatabaseClient.userBlock.findFirst({ where: { OR: [{ blockerId: input.senderId, blockedUserId: { in: await getOtherParticipants(input.conversationId, input.senderId) } }, { blockedUserId: input.senderId, blockerId: { in: await getOtherParticipants(input.conversationId, input.senderId) } }] } });
  if (blocked) throw new ForbiddenError(ERROR_MESSAGES.conversationBlocked);
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const recentMessageCount = await transaction.conversationMessage.count({ where: { senderId: input.senderId, createdAt: { gte: new Date(Date.now() - CONVERSATION_LIMITS.messageRateLimitWindowMilliseconds) } } });
    if (recentMessageCount >= CONVERSATION_LIMITS.messageRateLimitMaximum) throw new TooManyRequestsError(ERROR_MESSAGES.messageRateLimitReached);
    const message = await transaction.conversationMessage.create({ data: { conversationId: input.conversationId, senderId: input.senderId, body: input.body, moderationStatus: assessment.status, ...(assessment.reason ? { moderationReason: assessment.reason } : {}) }, include: { sender: { select: { id: true, fullName: true } } } });
    await transaction.conversation.update({ where: { id: input.conversationId }, data: { lastMessageAt: message.createdAt } });
    if (message.moderationStatus === MessageModerationStatus.APPROVED) {
      const recipients = await transaction.conversationParticipant.findMany({ where: { conversationId: input.conversationId, userId: { not: input.senderId }, leftAt: null }, select: { userId: true } });
      await transaction.notification.createMany({ data: recipients.map(({ userId }) => ({ recipientId: userId, type: NotificationType.MESSAGE_RECEIVED, title: 'New message', message: message.sender.fullName + ' sent you a message.', href: '/messages', deduplicationKey: 'message:' + message.id + ':recipient:' + userId, scheduledFor: new Date() })), skipDuplicates: true });
      await transaction.$queryRaw`SELECT pg_notify('uley_conversation_events', ${JSON.stringify({ conversationId: message.conversationId, messageId: message.id })})`;
    }
    return message;
  });
}

export async function createFlatmateSearchPost(input: { studentId: string; universityId?: string; city: string; neighborhood?: string; budgetAmount: number; rentalPeriod: string; moveInDate?: Date; description: string }) {
  const recentPosts = await prismaDatabaseClient.flatmatePost.count({ where: { studentId: input.studentId, createdAt: { gte: new Date(Date.now() - CONVERSATION_LIMITS.flatmatePostCreationRateLimitWindowMilliseconds) } } });
  if (recentPosts >= CONVERSATION_LIMITS.flatmatePostCreationRateLimitMaximum) throw new TooManyRequestsError(ERROR_MESSAGES.flatmatePostRateLimitReached);
  return prismaDatabaseClient.flatmatePost.create({ data: { studentId: input.studentId, ...(input.universityId ? { universityId: input.universityId } : {}), city: input.city, ...(input.neighborhood ? { neighborhood: input.neighborhood } : {}), budgetAmount: input.budgetAmount, rentalPeriod: input.rentalPeriod as never, ...(input.moveInDate ? { moveInDate: input.moveInDate } : {}), description: input.description } });
}

export async function searchFlatmatePosts(input: { city?: string; universityId?: string; rentalPeriod?: string; userId?: string }) {
  const blockedUsers = input.userId ? await prismaDatabaseClient.userBlock.findMany({ where: { OR: [{ blockerId: input.userId }, { blockedUserId: input.userId }] }, select: { blockerId: true, blockedUserId: true } }) : [];
  const blockedIds = blockedUsers.map((block) => block.blockerId === input.userId ? block.blockedUserId : block.blockerId);
  return prismaDatabaseClient.flatmatePost.findMany({ where: { status: FlatmatePostStatus.ACTIVE, ...(input.userId ? { studentId: { not: input.userId, notIn: blockedIds } } : {}), ...(input.city ? { city: { contains: input.city, mode: 'insensitive' } } : {}), ...(input.universityId ? { universityId: input.universityId } : {}), ...(input.rentalPeriod ? { rentalPeriod: input.rentalPeriod as never } : {}) }, orderBy: { createdAt: 'desc' }, take: CONVERSATION_LIMITS.flatmatePostsPerPage, include: { student: { select: { id: true, fullName: true, universityId: true } } } });
}

export async function changeFlatmatePostStatus(input: { postId: string; studentId: string; status: 'ACTIVE' | 'PAUSED' }) {
  const changed = await prismaDatabaseClient.flatmatePost.updateMany({ where: { id: input.postId, studentId: input.studentId, status: { not: FlatmatePostStatus.REMOVED } }, data: { status: input.status } });
  if (!changed.count) throw new NotFoundError(ERROR_MESSAGES.flatmatePostUnavailable);
  return prismaDatabaseClient.flatmatePost.findUnique({ where: { id: input.postId } });
}

export async function blockConversationUser(blockerId: string, blockedUserId: string) {
  if (blockerId === blockedUserId) throw new ConflictError(ERROR_MESSAGES.conversationCannotBlockSelf);
  if (!(await prismaDatabaseClient.user.findFirst({ where: { id: blockedUserId, isActive: true }, select: { id: true } }))) throw new NotFoundError(ERROR_MESSAGES.accountUnavailable);
  return prismaDatabaseClient.userBlock.upsert({ where: { blockerId_blockedUserId: { blockerId, blockedUserId } }, create: { blockerId, blockedUserId }, update: {} });
}

export function listFlaggedMessages() {
  return prismaDatabaseClient.conversationMessage.findMany({ where: { moderationStatus: MessageModerationStatus.REVIEW }, take: 100, orderBy: { createdAt: 'asc' }, include: { sender: { select: { fullName: true, email: true } }, conversation: { select: { id: true, type: true, subject: true } } } });
}

export async function decideFlaggedMessage(input: { messageId: string; reviewerId: string; decision: 'APPROVED' | 'REJECTED'; requestId: string }) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const result = await transaction.conversationMessage.updateMany({ where: { id: input.messageId, moderationStatus: MessageModerationStatus.REVIEW }, data: { moderationStatus: input.decision, moderationReviewerId: input.reviewerId, moderationReason: input.decision === MessageModerationStatus.REJECTED ? 'MODERATOR_REJECTED' : null } });
    if (!result.count) throw new NotFoundError(ERROR_MESSAGES.conversationUnavailable);
    const message = await transaction.conversationMessage.findUniqueOrThrow({ where: { id: input.messageId }, include: { sender: { select: { fullName: true } } } });
    if (input.decision === MessageModerationStatus.APPROVED) {
      const recipients = await transaction.conversationParticipant.findMany({ where: { conversationId: message.conversationId, userId: { not: message.senderId }, leftAt: null }, select: { userId: true } });
      await transaction.notification.createMany({ data: recipients.map(({ userId }) => ({ recipientId: userId, type: NotificationType.MESSAGE_RECEIVED, title: 'New message', message: message.sender.fullName + ' sent you a message.', href: '/messages', deduplicationKey: 'message:' + message.id + ':recipient:' + userId, scheduledFor: new Date() })), skipDuplicates: true });
      await transaction.$queryRaw`SELECT pg_notify('uley_conversation_events', ${JSON.stringify({ conversationId: message.conversationId, messageId: message.id })})`;
    }
    await transaction.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: input.reviewerId, requestId: input.requestId, targetType: 'CHAT_MESSAGE', targetId: message.id, summary: 'A flagged conversation message was moderated.', metadata: { decision: input.decision } } });
    return message;
  });
}

export async function requireConversationParticipant(conversationId: string, userId: string) {
  const member = await prismaDatabaseClient.conversationParticipant.findFirst({ where: { conversationId, userId, leftAt: null }, select: { id: true } });
  if (!member) throw new NotFoundError(ERROR_MESSAGES.conversationUnavailable);
  const otherUsers = await getOtherParticipants(conversationId, userId);
  const block = await prismaDatabaseClient.userBlock.findFirst({ where: { OR: [{ blockerId: userId, blockedUserId: { in: otherUsers } }, { blockedUserId: userId, blockerId: { in: otherUsers } }] }, select: { id: true } });
  if (block) throw new ForbiddenError(ERROR_MESSAGES.conversationBlocked);
  return member;
}

async function getOtherParticipants(conversationId: string, userId: string) {
  const participants = await prismaDatabaseClient.conversationParticipant.findMany({ where: { conversationId, userId: { not: userId }, leftAt: null }, select: { userId: true } });
  return participants.map(({ userId: participantId }) => participantId);
}
