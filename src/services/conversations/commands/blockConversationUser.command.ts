import { blockConversationUser as saveUserBlock } from '../../../repositories/conversation.repository.js';
export async function blockConversationUser(blockerId: string, blockedUserId: string) { return saveUserBlock(blockerId, blockedUserId); }
