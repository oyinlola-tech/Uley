import { findUserNotifications } from '../../../repositories/notification.repository.js';

export async function listMyNotifications(recipientId: string) {
  return findUserNotifications(recipientId);
}
