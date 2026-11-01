import { markConversationRead } from '../../../repositories/conversation.repository.js';
export async function markConversationAsRead(input: Parameters<typeof markConversationRead>[0]) { return markConversationRead(input); }
