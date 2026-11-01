import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { ADMIN_ROLE_PERMISSIONS } from '../constants/adminRole.constant.js';
import { SPONSORED_CAMPAIGN_LIMITS } from '../constants/sponsoredCampaign.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { requireAccountRole, requireAuthenticatedUser, requireOneOfAccountRoles } from '../middlewares/index.js';
import { confirmCampaignPayment, createLandlordCampaign, getAdminCampaigns, getLandlordCampaigns, receiveBachsWebhook, recordCampaignEvent, reviewCampaign, startLandlordCampaignCheckout, updateLandlordCampaignStatus, verifyLandlordCampaignCheckout } from '../controllers/sponsoredCampaign.controller.js';

export async function registerSponsoredCampaignRoutes(application: FastifyInstance): Promise<void> {
  const landlord = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  const admin = [requireAuthenticatedUser, requireOneOfAccountRoles(ADMIN_ROLE_PERMISSIONS.safety)];
  application.get(API_ENDPOINTS.landlordSponsoredCampaigns, { preHandler: landlord }, getLandlordCampaigns);
  application.post(API_ENDPOINTS.landlordSponsoredCampaigns, { preHandler: landlord }, createLandlordCampaign);
  application.post(API_ENDPOINTS.landlordSponsoredCampaignCheckouts, { preHandler: landlord, config: { rateLimit: { max: SPONSORED_CAMPAIGN_LIMITS.checkoutCreationRateLimitMaximum, timeWindow: SPONSORED_CAMPAIGN_LIMITS.checkoutCreationRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, startLandlordCampaignCheckout);
  application.get(`${API_ENDPOINTS.landlordSponsoredCampaignCheckouts}${API_ENDPOINTS.sponsoredCampaignCheckoutVerifyAction}`, { preHandler: landlord, config: { rateLimit: { max: SPONSORED_CAMPAIGN_LIMITS.checkoutVerificationRateLimitMaximum, timeWindow: SPONSORED_CAMPAIGN_LIMITS.checkoutVerificationRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, verifyLandlordCampaignCheckout);
  application.post(`${API_ENDPOINTS.landlordSponsoredCampaigns}${API_ENDPOINTS.sponsoredCampaignPauseAction}`, { preHandler: landlord }, updateLandlordCampaignStatus);
  application.get(API_ENDPOINTS.adminSponsoredCampaigns, { preHandler: admin }, getAdminCampaigns);
  application.post(`${API_ENDPOINTS.adminSponsoredCampaigns}${API_ENDPOINTS.sponsoredCampaignDecisionAction}`, { preHandler: admin }, reviewCampaign);
  application.post(`${API_ENDPOINTS.adminSponsoredCampaigns}${API_ENDPOINTS.sponsoredCampaignPaymentAction}`, { preHandler: admin }, confirmCampaignPayment);
  application.post(`${API_ENDPOINTS.sponsoredCampaigns}${API_ENDPOINTS.sponsoredCampaignEventAction}`, { config: { rateLimit: { max: SPONSORED_CAMPAIGN_LIMITS.eventRateLimitMaximum, timeWindow: SPONSORED_CAMPAIGN_LIMITS.eventRateLimitWindowMilliseconds } } }, recordCampaignEvent);
  application.post(API_ENDPOINTS.bachsWebhook, { config: { rawBody: true, rateLimit: { max: SPONSORED_CAMPAIGN_LIMITS.webhookRateLimitMaximum, timeWindow: SPONSORED_CAMPAIGN_LIMITS.webhookRateLimitWindowMilliseconds } } }, receiveBachsWebhook);
}
