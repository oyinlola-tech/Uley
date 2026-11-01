import { listUserConversations } from '../../../repositories/conversation.repository.js';
export async function listConversationsForUser(userId: string) { return listUserConversations(userId); }
