import { sendConversationMessage as saveConversationMessage } from '../../../repositories/conversation.repository.js';
export async function sendConversationMessage(input: Parameters<typeof saveConversationMessage>[0]) { return saveConversationMessage(input); }
