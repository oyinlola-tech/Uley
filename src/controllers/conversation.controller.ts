import type { FastifyReply, FastifyRequest } from 'fastify';
import { ContentReportStatus, ConversationType, MessageModerationStatus, UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { appealRejectedConversationMessage, blockConversationUser, changeOwnFlatmatePostStatus, createFlatmatePost, decideRejectedMessageAppeal, listConversationsForUser, listMessageAppealsForModerators, listMessagesForConversation, markConversationAsRead as markRead, reportConversationContent, searchFlatmatePostsForUser, sendConversationMessage, startConversation } from '../services/conversations/index.js';
import { appealRejectedMessageSchema, createConversationSchema, createFlatmatePostSchema, contentReportSchema, reviewContentReportSchema, reviewFlaggedMessageSchema, reviewMessageAppealSchema, sendConversationMessageSchema, updateFlatmatePostStatusSchema } from '../validations/conversation.validation.js';
import { listContentReportsForModeration, listFlaggedChatMessages, reviewContentReport, reviewFlaggedMessage } from '../services/conversations/index.js';
import { createSignedImageUrls } from '../services/mediaScanning/index.js';

export async function createConversation(request: FastifyRequest, reply: FastifyReply) {
  const body = createConversationSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const user = requireUser(request);
  const conversation = await startConversation({ userId: user.id, userRole: user.userRole, type: body.data.type, ...(body.data.propertyId ? { propertyId: body.data.propertyId } : {}), ...(body.data.flatmatePostId ? { flatmatePostId: body.data.flatmatePostId } : {}), ...(body.data.subject ? { subject: body.data.subject } : {}) });
  return reply.code(201).send({ conversation });
}

export async function getMyConversations(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ conversations: await listConversationsForUser(requireUser(request).id) });
}

export async function getConversationMessages(request: FastifyRequest, reply: FastifyReply) {
  const { conversationId } = request.params as { conversationId: string };
  const afterValue = (request.query as { after?: string }).after;
  const after = afterValue ? new Date(afterValue) : undefined;
  if (after && Number.isNaN(after.getTime())) throw new ValidationError();
  const messages = await listMessagesForConversation({ conversationId, userId: requireUser(request).id, ...(after ? { after } : {}) });
  return reply.send({ messages });
}

export async function sendMessage(request: FastifyRequest, reply: FastifyReply) {
  const body = sendConversationMessageSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { conversationId } = request.params as { conversationId: string };
  const message = await sendConversationMessage({ conversationId, senderId: requireUser(request).id, body: body.data.body });
  return reply.code(201).send({ message });
}

export async function markConversationAsRead(request: FastifyRequest, reply: FastifyReply) {
  const { conversationId } = request.params as { conversationId: string };
  return reply.send(await markRead({ conversationId, userId: requireUser(request).id }));
}

export async function blockUser(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request.params as { userId: string };
  return reply.code(201).send({ block: await blockConversationUser(requireUser(request).id, userId) });
}

export async function getFlatmatePosts(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { city?: string; universityId?: string; rentalPeriod?: string };
  return reply.send({ posts: await searchFlatmatePostsForUser({ ...(query.city ? { city: query.city } : {}), ...(query.universityId ? { universityId: query.universityId } : {}), ...(query.rentalPeriod ? { rentalPeriod: query.rentalPeriod } : {}), ...(request.authenticatedUser?.id ? { userId: request.authenticatedUser.id } : {}) }) });
}

export async function createFlatmateSearchPost(request: FastifyRequest, reply: FastifyReply) {
  const body = createFlatmatePostSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const user = requireUser(request);
  if (user.userRole !== UserRole.STUDENT) throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired('student'));
  const post = await createFlatmatePost({ studentId: user.id, ...(user.universityId ? { universityId: user.universityId } : {}), city: body.data.city, budgetAmount: body.data.budgetAmount, rentalPeriod: body.data.rentalPeriod, description: body.data.description, ...(body.data.neighborhood ? { neighborhood: body.data.neighborhood } : {}), ...(body.data.moveInDate ? { moveInDate: body.data.moveInDate } : {}) });
  return reply.code(201).send({ post });
}

export async function updateOwnFlatmatePost(request: FastifyRequest, reply: FastifyReply) {
  const body = updateFlatmatePostStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { postId } = request.params as { postId: string };
  const post = await changeOwnFlatmatePostStatus({ postId, studentId: requireUser(request).id, status: body.data.status });
  return reply.send({ post });
}

export async function contactFlatmatePost(request: FastifyRequest, reply: FastifyReply) {
  const { postId } = request.params as { postId: string };
  const conversation = await startConversation({ userId: requireUser(request).id, userRole: requireUser(request).userRole, type: ConversationType.FLATMATE, flatmatePostId: postId });
  return reply.code(201).send({ conversation });
}

export async function reportContent(request: FastifyRequest, reply: FastifyReply) {
  const body = contentReportSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const user = requireUser(request);
  const report = await reportConversationContent({ reporterId: user.id, reason: body.data.reason, ...(body.data.messageId ? { messageId: body.data.messageId } : {}), ...(body.data.flatmatePostId ? { flatmatePostId: body.data.flatmatePostId } : {}), ...(body.data.userAdvertisementId ? { userAdvertisementId: body.data.userAdvertisementId } : {}), ...(body.data.details ? { details: body.data.details } : {}) });
  return reply.code(201).send({ report });
}

export async function getContentModerationQueue(request: FastifyRequest, reply: FastifyReply) {
  const moderatorId = requireUser(request).id;
  await prismaDatabaseClient.systemLog.create({ data: { eventType: 'ADMIN_ACTION', level: 'INFO', actorId: moderatorId, requestId: request.id, targetType: 'MODERATION_QUEUE', summary: 'A moderator opened the chat safety queue.' } });
  const [reports, messages, appeals] = await Promise.all([listContentReportsForModeration(), listFlaggedChatMessages(), listMessageAppealsForModerators()]);
  const keys = reports.flatMap((report) => report.advertisement?.imageStorageKey ? [report.advertisement.imageStorageKey] : []);
  const imageUrls = await createSignedImageUrls(keys);
  const reportsWithImages = reports.map((report) => ({ ...report, advertisement: report.advertisement ? { ...report.advertisement, imageUrl: report.advertisement.imageStorageKey ? imageUrls[report.advertisement.imageStorageKey] : null, imageStorageKey: undefined } : null }));
  return reply.send({ reports: reportsWithImages, messages, appeals });
}

export async function appealRejectedMessageFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = appealRejectedMessageSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { messageId } = request.params as { messageId: string };
  return reply.code(201).send({ appeal: await appealRejectedConversationMessage({ messageId, senderId: requireUser(request).id, reason: body.data.reason }) });
}

export async function reviewMessageAppealFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewMessageAppealSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { appealId } = request.params as { appealId: string };
  const appeal = await decideRejectedMessageAppeal({ appealId, reviewerId: requireUser(request).id, decision: body.data.decision, reviewNote: body.data.reviewNote, requestId: request.id });
  return reply.send({ appeal });
}

export async function reviewContentReportFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewContentReportSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { reportId } = request.params as { reportId: string };
  const status = body.data.status as ContentReportStatus;
  const report = await reviewContentReport({ reportId, reviewerId: requireUser(request).id, status, reviewNote: body.data.reviewNote, requestId: request.id });
  return reply.send({ report });
}

export async function decideFlaggedMessageFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewFlaggedMessageSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  const { messageId } = request.params as { messageId: string };
  const message = await reviewFlaggedMessage({ messageId, reviewerId: requireUser(request).id, decision: body.data.decision, requestId: request.id });
  return reply.send({ message });
}

function requireUser(request: FastifyRequest) {
  if (!request.authenticatedUser) throw new ForbiddenError(ERROR_MESSAGES.unauthorized);
  return request.authenticatedUser;
}
