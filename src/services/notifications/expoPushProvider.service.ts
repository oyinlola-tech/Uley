import { applicationEnvironment } from '../../configs/env.config.js';
import { PUSH_NOTIFICATION_MESSAGES } from '../../constants/pushNotification.constant.js';

const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface ExpoPushDeliveryMessage {
  to: string;
  data: { notificationId: string; href: string | null };
}

function expoPushHeaders() {
  return {
    accept: 'application/json',
    'accept-encoding': 'gzip, deflate',
    'content-type': 'application/json',
    ...(applicationEnvironment.expoPushAccessToken ? { authorization: `Bearer ${applicationEnvironment.expoPushAccessToken}` } : {}),
  };
}

export async function sendExpoPushMessages(messages: ExpoPushDeliveryMessage[]): Promise<ExpoPushTicket[]> {
  const response = await fetch(EXPO_PUSH_SEND_URL, {
    method: 'POST', headers: expoPushHeaders(), body: JSON.stringify(messages.map((message) => ({
      to: message.to, title: PUSH_NOTIFICATION_MESSAGES.defaultTitle,
      body: PUSH_NOTIFICATION_MESSAGES.defaultBody, data: message.data,
      sound: 'default', priority: 'high', ttl: 60 * 60 * 24,
    }))), signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Expo Push API returned HTTP ${response.status}`);
  const result = await response.json() as { data?: ExpoPushTicket[] };
  if (!Array.isArray(result.data)) throw new Error('Expo Push API returned no ticket list');
  return result.data;
}

export async function getExpoPushReceipts(ticketIds: string[]) {
  const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
    method: 'POST', headers: expoPushHeaders(), body: JSON.stringify({ ids: ticketIds }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Expo receipt API returned HTTP ${response.status}`);
  const result = await response.json() as { data?: Record<string, { status: 'ok' | 'error'; message?: string; details?: { error?: string } }> };
  if (!result.data) throw new Error('Expo receipt API returned no receipts');
  return result.data;
}
