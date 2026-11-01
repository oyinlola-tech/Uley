export const CONVERSATION_LIMITS = {
  messageMinimumLength: 1,
  messageMaximumLength: 3000,
  messagesPerPage: 50,
  conversationsPerPage: 50,
  contentReportRateLimitMaximum: 10,
  contentReportRateLimitWindowMilliseconds: 60 * 60_000,
  flatmatePostsPerPage: 30,
  flatmatePostDescriptionMaximumLength: 1500,
  messageRateLimitMaximum: 20,
  messageRateLimitWindowMilliseconds: 60_000,
  conversationStartRateLimitMaximum: 10,
  conversationStartRateLimitWindowMilliseconds: 60_000,
  flatmateContactRateLimitMaximum: 4,
  flatmateContactRateLimitWindowMilliseconds: 10 * 60_000,
  flatmateConversationCooldownMilliseconds: 30_000,
  flatmatePostCreationRateLimitMaximum: 3,
  flatmatePostCreationRateLimitWindowMilliseconds: 30 * 60_000,
  messageAppealReasonMinimumLength: 20,
  messageAppealReasonMaximumLength: 1000,
  messageAppealReviewNoteMinimumLength: 10,
  messageAppealReviewNoteMaximumLength: 500,
  messageAppealRateLimitMaximum: 5,
  messageAppealRateLimitWindowMilliseconds: 60 * 60_000,
} as const;

export const CHAT_MODERATION_TERMS = [
  'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dickhead', 'motherfucker',
] as const;
