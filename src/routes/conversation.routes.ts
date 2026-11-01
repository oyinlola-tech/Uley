import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { CONVERSATION_LIMITS } from '../constants/conversation.constant.js';
import { requireAuthenticatedUser } from '../middlewares/index.js';
import { appealRejectedMessageFromRequest, blockUser, contactFlatmatePost, createConversation, createFlatmateSearchPost, getConversationMessages, getFlatmatePosts, getMyConversations, markConversationAsRead, reportContent, sendMessage, updateOwnFlatmatePost } from '../controllers/conversation.controller.js';
import { registerConversationRealtimeRoute } from '../services/conversations/index.js';

export async function registerConversationRoutes(application: FastifyInstance): Promise<void> {
  registerConversationRealtimeRoute(application);
  const signedIn = [requireAuthenticatedUser];
  application.get(API_ENDPOINTS.conversations, { preHandler: signedIn }, getMyConversations);
  application.post(API_ENDPOINTS.conversations, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.conversationStartRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.conversationStartRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, createConversation);
  application.get(`${API_ENDPOINTS.conversations}${API_ENDPOINTS.conversationMessages}`, { preHandler: signedIn }, getConversationMessages);
  application.post(`${API_ENDPOINTS.conversations}${API_ENDPOINTS.conversationMessages}`, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.messageRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.messageRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, sendMessage);
  application.post(`${API_ENDPOINTS.conversations}${API_ENDPOINTS.conversationMessages}${API_ENDPOINTS.conversationMessageAppealAction}`, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.messageAppealRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.messageAppealRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, appealRejectedMessageFromRequest);
  application.post(`${API_ENDPOINTS.conversations}${API_ENDPOINTS.conversationRead}`, { preHandler: signedIn }, markConversationAsRead);
  application.post(API_ENDPOINTS.conversationBlock, { preHandler: signedIn }, blockUser);
  application.get(API_ENDPOINTS.flatmatePosts, { preHandler: signedIn }, getFlatmatePosts);
  application.post(API_ENDPOINTS.flatmatePosts, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.flatmatePostCreationRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.flatmatePostCreationRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, createFlatmateSearchPost);
  application.post(`${API_ENDPOINTS.flatmatePosts}${API_ENDPOINTS.flatmatePostStatusAction}`, { preHandler: signedIn }, updateOwnFlatmatePost);
  application.post(`${API_ENDPOINTS.flatmatePosts}${API_ENDPOINTS.flatmateInterest}`, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.flatmateContactRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.flatmateContactRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, contactFlatmatePost);
  application.post(API_ENDPOINTS.contentReports, { preHandler: signedIn, config: { rateLimit: { max: CONVERSATION_LIMITS.contentReportRateLimitMaximum, timeWindow: CONVERSATION_LIMITS.contentReportRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, reportContent);
}
