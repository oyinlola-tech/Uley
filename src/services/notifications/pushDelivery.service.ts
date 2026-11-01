import type { FastifyBaseLogger } from 'fastify';
import { PUSH_NOTIFICATION_LIMITS } from '../../constants/pushNotification.constant.js';
import { claimQueuedPushDeliveries, deferPushReceiptCheck, expirePushReceipt, listDuePushReceipts, prepareDuePushDeliveries, retryOrFailPushDelivery, savePushReceipt, savePushTicket } from '../../repositories/pushNotification.repository.js';
import { getExpoPushReceipts, sendExpoPushMessages } from './expoPushProvider.service.js';

export async function dispatchQueuedPushNotifications(logger: FastifyBaseLogger) {
  await prepareDuePushDeliveries();
  const deliveries = await claimQueuedPushDeliveries();
  if (deliveries.length) await sendClaimedPushDeliveries(deliveries, logger);
  await reconcilePushReceipts(logger);
}

async function sendClaimedPushDeliveries(deliveries: Awaited<ReturnType<typeof claimQueuedPushDeliveries>>, logger: FastifyBaseLogger) {
  const messages = deliveries.map((delivery) => ({ to: delivery.pushDevice.expoPushToken, data: { notificationId: delivery.notification.id, href: delivery.notification.href } }));
  try {
    const tickets = await sendExpoPushMessages(messages);
    await Promise.all(deliveries.map(async (delivery, index) => {
      const ticket = tickets[index];
      if (ticket?.status === 'ok' && ticket.id) return savePushTicket({ deliveryId: delivery.id, ticketId: ticket.id });
      await retryOrFailPushDelivery({ deliveryId: delivery.id, attempts: delivery.attempts, deviceId: delivery.pushDevice.id, error: ticket?.details?.error ?? ticket?.message ?? 'Expo returned an incomplete ticket' });
    }));
  } catch (error) {
    logger.error({ err: error, pushCount: deliveries.length }, 'Could not send queued mobile push notifications');
    await Promise.all(deliveries.map((delivery) => retryOrFailPushDelivery({ deliveryId: delivery.id, attempts: delivery.attempts, error: 'Expo push service temporarily unavailable' })));
  }
}

async function reconcilePushReceipts(logger: FastifyBaseLogger) {
  const deliveries = await listDuePushReceipts();
  if (!deliveries.length) return;
  const unexpired = [];
  for (const delivery of deliveries) {
    if (await expirePushReceipt({ deliveryId: delivery.id, createdAt: delivery.createdAt })) continue;
    unexpired.push(delivery);
  }
  if (!unexpired.length) return;
  try {
    const receipts = await getExpoPushReceipts(unexpired.flatMap((delivery) => delivery.expoTicketId ? [delivery.expoTicketId] : []));
    await Promise.all(unexpired.map(async (delivery) => {
      const receipt = delivery.expoTicketId ? receipts[delivery.expoTicketId] : undefined;
      if (!receipt) return deferPushReceiptCheck(delivery.id);
      const error = receipt.details?.error ?? receipt.message;
      return savePushReceipt({ deliveryId: delivery.id, deviceId: delivery.pushDeviceId, status: receipt.status === 'ok' ? 'DELIVERED' : 'FAILED', ...(error ? { error } : {}) });
    }));
  } catch (error) {
    logger.error({ err: error, receiptCount: unexpired.length }, 'Could not reconcile mobile push receipts');
    await Promise.all(unexpired.map((delivery) => deferPushReceiptCheck(delivery.id)));
  }
}

export function startPushNotificationWorker(logger: FastifyBaseLogger, onClose: (cleanup: () => void) => void) {
  let processing = false;
  const processQueue = async () => {
    if (processing) return;
    processing = true;
    try { await dispatchQueuedPushNotifications(logger); }
    catch (error) { logger.error({ err: error }, 'Push notification worker iteration failed'); }
    finally { processing = false; }
  };
  const timer = setInterval(() => void processQueue(), PUSH_NOTIFICATION_LIMITS.deliveryPollMilliseconds);
  timer.unref();
  void processQueue();
  onClose(() => clearInterval(timer));
}
