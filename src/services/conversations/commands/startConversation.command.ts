import { createOrFindConversation } from '../../../repositories/conversation.repository.js';
export async function startConversation(input: Parameters<typeof createOrFindConversation>[0]) { return createOrFindConversation(input); }
