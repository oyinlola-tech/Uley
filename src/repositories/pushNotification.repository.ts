import { PushDeliveryStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { PUSH_NOTIFICATION_LIMITS } from '../constants/pushNotification.constant.js';

export async function registerUserPushDevice(input: { userId: string; expoPushToken: string; platform: 'IOS' | 'ANDROID' }) {
  return prismaDatabaseClient.pushDevice.upsert({
    where: { expoPushToken: input.expoPushToken },
    create: { ...input, isActive: true },
    update: { userId: input.userId, platform: input.platform, isActive: true, lastRegisteredAt: new Date() },
    select: { id: true },
  });
}

export function removeUserPushDevice(input: { userId: string; expoPushToken: string }) {
  return prismaDatabaseClient.pushDevice.deleteMany({ where: { userId: input.userId, expoPushToken: input.expoPushToken } });
}

export async function prepareDuePushDeliveries() {
  const now = new Date();
  const notifications = await prismaDatabaseClient.notification.findMany({
    where: { pushPreparedAt: null, scheduledFor: { lte: now }, recipient: { isActive: true } },
    orderBy: { scheduledFor: 'asc' }, take: PUSH_NOTIFICATION_LIMITS.deliveryBatchSize,
    select: { id: true, recipientId: true },
  });
  for (const notification of notifications) {
    await prismaDatabaseClient.$transaction(async (transaction) => {
      const claimed = await transaction.notification.updateMany({ where: { id: notification.id, pushPreparedAt: null }, data: { pushPreparedAt: now } });
      if (!claimed.count) return;
      const devices = await transaction.pushDevice.findMany({ where: { userId: notification.recipientId, isActive: true }, select: { id: true } });
      if (devices.length) await transaction.pushDelivery.createMany({
        data: devices.map((device) => ({ notificationId: notification.id, pushDeviceId: device.id })),
        skipDuplicates: true,
      });
    });
  }
}

export async function claimQueuedPushDeliveries() {
  const now = new Date();
  const candidates = await prismaDatabaseClient.pushDelivery.findMany({
    where: { status: { in: [PushDeliveryStatus.QUEUED, PushDeliveryStatus.SENDING] }, nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }], pushDevice: { isActive: true } },
    orderBy: { createdAt: 'asc' }, take: PUSH_NOTIFICATION_LIMITS.deliveryBatchSize,
    include: { pushDevice: { select: { id: true, expoPushToken: true } }, notification: { select: { id: true, href: true } } },
  });
  const claimed = [];
  for (const candidate of candidates) {
    const changed = await prismaDatabaseClient.pushDelivery.updateMany({
      where: { id: candidate.id, status: candidate.status, nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }] },
      data: { status: PushDeliveryStatus.SENDING, leaseUntil: new Date(now.getTime() + PUSH_NOTIFICATION_LIMITS.deliveryLeaseMilliseconds), attempts: { increment: 1 } },
    });
    if (changed.count) claimed.push({ ...candidate, attempts: candidate.attempts + 1 });
  }
  return claimed;
}

export async function savePushTicket(input: { deliveryId: string; ticketId: string }) {
  return prismaDatabaseClient.pushDelivery.update({ where: { id: input.deliveryId }, data: { status: PushDeliveryStatus.TICKETED, expoTicketId: input.ticketId, leaseUntil: null } });
}

export async function retryOrFailPushDelivery(input: { deliveryId: string; attempts: number; error: string; deviceId?: string }) {
  const permanentlyFailed = input.attempts >= PUSH_NOTIFICATION_LIMITS.maximumDeliveryAttempts;
  await prismaDatabaseClient.$transaction(async (transaction) => {
    if (input.deviceId && input.error === 'DeviceNotRegistered') await transaction.pushDevice.update({ where: { id: input.deviceId }, data: { isActive: false } });
    await transaction.pushDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: permanentlyFailed || input.error === 'DeviceNotRegistered' ? PushDeliveryStatus.FAILED : PushDeliveryStatus.QUEUED,
        lastError: input.error.slice(0, 250), leaseUntil: null,
        nextAttemptAt: new Date(Date.now() + Math.min(60 * 60_000, 2 ** input.attempts * 5_000)),
      },
    });
  });
}

export async function listDuePushReceipts() {
  const now = new Date();
  return prismaDatabaseClient.pushDelivery.findMany({
    where: { status: PushDeliveryStatus.TICKETED, expoTicketId: { not: null }, createdAt: { lte: new Date(now.getTime() - PUSH_NOTIFICATION_LIMITS.receiptPollMilliseconds) }, OR: [{ receiptCheckedAt: null }, { receiptCheckedAt: { lte: new Date(now.getTime() - PUSH_NOTIFICATION_LIMITS.receiptPollMilliseconds) } }] },
    take: PUSH_NOTIFICATION_LIMITS.deliveryBatchSize,
    select: { id: true, expoTicketId: true, createdAt: true, pushDeviceId: true },
  });
}

export async function savePushReceipt(input: { deliveryId: string; deviceId: string; status: 'DELIVERED' | 'FAILED'; error?: string }) {
  await prismaDatabaseClient.$transaction(async (transaction) => {
    if (input.error === 'DeviceNotRegistered') await transaction.pushDevice.updateMany({ where: { id: input.deviceId }, data: { isActive: false } });
    await transaction.pushDelivery.update({ where: { id: input.deliveryId }, data: { status: input.status, ...(input.error ? { lastError: input.error.slice(0, 250) } : {}), receiptCheckedAt: new Date(), leaseUntil: null } });
  });
}

export async function deferPushReceiptCheck(deliveryId: string) {
  return prismaDatabaseClient.pushDelivery.update({ where: { id: deliveryId }, data: { receiptCheckedAt: new Date() } });
}

export async function expirePushReceipt(input: { deliveryId: string; createdAt: Date }) {
  if (Date.now() - input.createdAt.getTime() < PUSH_NOTIFICATION_LIMITS.maximumReceiptAgeMilliseconds) return false;
  await prismaDatabaseClient.pushDelivery.update({ where: { id: input.deliveryId }, data: { status: PushDeliveryStatus.FAILED, lastError: 'Expo receipt expired', receiptCheckedAt: new Date() } });
  return true;
}
