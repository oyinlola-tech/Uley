import { NotificationType } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { INSPECTION_REMINDER_OFFSETS, INSPECTION_NOTIFICATION_PAGE_SIZE } from '../constants/inspectionLifecycle.constant.js';

type NotificationInput = { recipientId: string; type: NotificationType; title: string; message: string; href?: string; deduplicationKey: string; scheduledFor?: Date };

export async function enqueueUserNotification(input: NotificationInput) {
  return prismaDatabaseClient.notification.createMany({
    data: [{ ...input, scheduledFor: input.scheduledFor ?? new Date() }],
    skipDuplicates: true,
  });
}

export async function enqueueInspectionReminders(input: { inspectionId: string; scheduledFor: Date; studentId: string; landlordId: string; propertyName: string; unitName: string }) {
  const now = new Date();
  const recipients = [input.studentId, input.landlordId];
  const reminders = INSPECTION_REMINDER_OFFSETS.flatMap((offset) => {
    const scheduledFor = new Date(input.scheduledFor.getTime() - offset.milliseconds);
    if (scheduledFor.getTime() <= now.getTime() && offset.key !== '24h') return [];
    return recipients.map((recipientId) => ({
      recipientId, type: NotificationType.INSPECTION_REMINDER,
      title: 'Upcoming home inspection',
      message: 'Your visit to ' + input.propertyName + ' · ' + input.unitName + ' is ' + offset.label + '.',
      href: '/inspections',
      deduplicationKey: 'inspection:' + input.inspectionId + ':reminder:' + input.scheduledFor.getTime() + ':' + offset.key + ':' + recipientId,
      scheduledFor: scheduledFor < now ? now : scheduledFor,
    }));
  });
  if (reminders.length) await prismaDatabaseClient.notification.createMany({ data: reminders, skipDuplicates: true });
}

export async function findUserNotifications(recipientId: string) {
  const now = new Date();
  const notifications = await prismaDatabaseClient.notification.findMany({
    where: { recipientId, scheduledFor: { lte: now } },
    orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
    take: INSPECTION_NOTIFICATION_PAGE_SIZE,
  });
  const unreadCount = notifications.filter((notification) => notification.readAt === null).length;
  return { notifications, unreadCount };
}

export async function markUserNotificationRead(input: { notificationId: string; recipientId: string }) {
  const update = await prismaDatabaseClient.notification.updateMany({
    where: { id: input.notificationId, recipientId: input.recipientId, readAt: null, scheduledFor: { lte: new Date() } },
    data: { readAt: new Date() },
  });
  return update.count;
}
