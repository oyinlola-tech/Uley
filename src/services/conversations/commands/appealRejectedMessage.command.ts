import { createMessageModerationAppeal } from '../../../repositories/messageModerationAppeal.repository.js';

export async function appealRejectedConversationMessage(input: { messageId: string; senderId: string; reason: string }) {
  return createMessageModerationAppeal(input);
}
