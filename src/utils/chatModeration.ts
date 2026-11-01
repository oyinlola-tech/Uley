import { CHAT_MODERATION_TERMS } from '../constants/conversation.constant.js';
import { MessageModerationStatus } from '@prisma/client';

const LEET_CHARACTER_MAP: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

export function assessChatMessage(body: string) {
  const normalizedWords = body.toLocaleLowerCase().replace(/[013457@$]/g, (character) => LEET_CHARACTER_MAP[character] ?? character).match(/[a-z]+/g) ?? [];
  const flaggedTerm = normalizedWords.find((word) => CHAT_MODERATION_TERMS.includes(word as (typeof CHAT_MODERATION_TERMS)[number]));
  return flaggedTerm
    ? { status: MessageModerationStatus.REVIEW, reason: 'POTENTIALLY_OFFENSIVE_LANGUAGE' }
    : { status: MessageModerationStatus.APPROVED, reason: null };
}
