import type { FastifyInstance, FastifyRequest } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { requireAuthenticatedUser } from '../middlewares/index.js';
import { getMyNotifications, markMyNotificationRead } from '../controllers/notification.controller.js';
import { registerAuthenticatedPushDevice, removeAuthenticatedPushDevice } from '../controllers/pushDevice.controller.js';
import { PUSH_DEVICE_RATE_LIMIT } from '../constants/pushNotification.constant.js';

export async function registerNotificationRoutes(application: FastifyInstance): Promise<void> {
  application.get(API_ENDPOINTS.notifications, { preHandler: [requireAuthenticatedUser] }, getMyNotifications);
  application.post(API_ENDPOINTS.notifications + API_ENDPOINTS.notificationReadAction, { preHandler: [requireAuthenticatedUser] }, markMyNotificationRead);
  const pushDeviceOptions = { preHandler: [requireAuthenticatedUser], config: { rateLimit: { ...PUSH_DEVICE_RATE_LIMIT, keyGenerator: (request: FastifyRequest) => request.authenticatedUser?.id ?? request.ip } } };
  application.post(API_ENDPOINTS.pushDevices, pushDeviceOptions, registerAuthenticatedPushDevice);
  application.delete(API_ENDPOINTS.pushDevices, pushDeviceOptions, removeAuthenticatedPushDevice);
}
