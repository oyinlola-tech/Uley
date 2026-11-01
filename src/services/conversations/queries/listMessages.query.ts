import { listConversationMessages } from '../../../repositories/conversation.repository.js';
export async function listMessagesForConversation(input: Parameters<typeof listConversationMessages>[0]) { return listConversationMessages(input); }
