import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS, API_VERSION_PREFIX } from '../constants/apiEndpoint.constant.js';
import { registerAuthenticationRoutes } from './auth.routes.js';
import { registerHealthRoutes } from './health.routes.js';
import { registerPropertyRoutes } from './property.routes.js';
import { registerManagementRoutes } from './management.routes.js';
import { registerInspectionRoutes } from './inspection.routes.js';
import { registerAdminRoutes } from './admin.routes.js';
import { registerUniversityRoutes } from './university.routes.js';
import { registerNotificationRoutes } from './notification.routes.js';
import { registerInspectionLifecycleRoutes } from './inspectionLifecycle.routes.js';
import { registerConversationRoutes } from './conversation.routes.js';
import { registerSponsoredCampaignRoutes } from './sponsoredCampaign.routes.js';
import { registerComplaintRoutes } from './complaint.routes.js';
import { registerProfileRoutes } from './profile.routes.js';
import { registerUserAdvertisementRoutes } from './userAdvertisement.routes.js';
import { registerRentalApplicationRoutes } from './rentalApplication.routes.js';

export async function registerApplicationRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  await fastifyApplication.register(registerHealthRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerAuthenticationRoutes, { prefix: `${API_VERSION_PREFIX}${API_ENDPOINTS.authBase}` });
  await fastifyApplication.register(registerPropertyRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerUniversityRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerNotificationRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerManagementRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerInspectionRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerInspectionLifecycleRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerRentalApplicationRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerConversationRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerProfileRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerSponsoredCampaignRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerUserAdvertisementRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerComplaintRoutes, { prefix: API_VERSION_PREFIX });
  await fastifyApplication.register(registerAdminRoutes, { prefix: API_VERSION_PREFIX });
}
