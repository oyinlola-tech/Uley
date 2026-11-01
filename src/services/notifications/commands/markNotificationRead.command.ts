import { markUserNotificationRead } from '../../../repositories/notification.repository.js';

export async function markNotificationRead(input: { notificationId: string; recipientId: string }) {
  return markUserNotificationRead(input);
}
