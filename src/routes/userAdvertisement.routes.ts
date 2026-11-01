import type { FastifyInstance } from 'fastify';
import { ADMIN_ROLE_PERMISSIONS } from '../constants/adminRole.constant.js';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { USER_ADVERTISEMENT_LIMITS } from '../constants/userAdvertisement.constant.js';
import { requireAuthenticatedUser, requireOneOfAccountRoles } from '../middlewares/index.js';
import { UserRole } from '../enums/userRole.enum.js';
import { uploadMyAdvertisementImage } from '../controllers/userAdvertisementImage.controller.js';
import { browseUserAdvertisements, changeOwnUserAdvertisementStatus, contactUserAdvertisementOwner, createUserAdvertisement, getOwnUserAdvertisementAnalyticsFromRequest, getOwnUserAdvertisements, listUserAdvertisementsForReview, recordUserAdvertisementInteraction, reviewUserAdvertisementFromRequest, startUserAdvertisementCheckoutFromRequest, verifyUserAdvertisementCheckoutFromRequest } from '../controllers/userAdvertisement.controller.js';

export async function registerUserAdvertisementRoutes(application: FastifyInstance) {
  const signedIn = [requireAuthenticatedUser];
  const advertiser = { preHandler: [requireAuthenticatedUser, requireOneOfAccountRoles([UserRole.STUDENT, UserRole.BUSINESS_ADVERTISER])] };
  const student = { preHandler: [requireAuthenticatedUser, requireOneOfAccountRoles([UserRole.STUDENT])] };
  const signedInOptions = { preHandler: signedIn };
  const moderator = { preHandler: [requireAuthenticatedUser, requireOneOfAccountRoles(ADMIN_ROLE_PERMISSIONS.safety)] };
  application.get(API_ENDPOINTS.userAdvertisements, signedInOptions, browseUserAdvertisements);
  application.post(API_ENDPOINTS.userAdvertisements, { ...advertiser, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.maximumPostsPerDay, timeWindow: USER_ADVERTISEMENT_LIMITS.postRateWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, createUserAdvertisement);
  application.post(`${API_ENDPOINTS.userAdvertisements}${API_ENDPOINTS.userAdvertisementImageAction}`, { ...advertiser, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.imageUploadRateLimitMaximum, timeWindow: USER_ADVERTISEMENT_LIMITS.imageUploadRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, uploadMyAdvertisementImage);
  application.get(API_ENDPOINTS.userAdvertisementMine, advertiser, getOwnUserAdvertisements);
  application.get(API_ENDPOINTS.userAdvertisementAnalytics, advertiser, getOwnUserAdvertisementAnalyticsFromRequest);
  application.post(API_ENDPOINTS.userAdvertisementCheckouts, { ...advertiser, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.checkoutCreationRateLimitMaximum, timeWindow: USER_ADVERTISEMENT_LIMITS.checkoutRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, startUserAdvertisementCheckoutFromRequest);
  application.get(`${API_ENDPOINTS.userAdvertisementCheckouts}${API_ENDPOINTS.userAdvertisementCheckoutVerify}`, { ...advertiser, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.checkoutVerificationRateLimitMaximum, timeWindow: USER_ADVERTISEMENT_LIMITS.checkoutRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, verifyUserAdvertisementCheckoutFromRequest);
  application.patch(`${API_ENDPOINTS.userAdvertisements}${API_ENDPOINTS.userAdvertisementStatusAction}`, advertiser, changeOwnUserAdvertisementStatus);
  application.post(`${API_ENDPOINTS.userAdvertisements}${API_ENDPOINTS.userAdvertisementContactAction}`, { ...signedInOptions, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.contactRateLimitMaximum, timeWindow: USER_ADVERTISEMENT_LIMITS.contactRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, contactUserAdvertisementOwner);
  application.post(`${API_ENDPOINTS.userAdvertisements}${API_ENDPOINTS.userAdvertisementEventAction}`, { ...student, config: { rateLimit: { max: USER_ADVERTISEMENT_LIMITS.eventRateLimitMaximum, timeWindow: USER_ADVERTISEMENT_LIMITS.eventRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, recordUserAdvertisementInteraction);
  application.get(API_ENDPOINTS.adminUserAdvertisements, moderator, listUserAdvertisementsForReview);
  application.post(`${API_ENDPOINTS.adminUserAdvertisements}${API_ENDPOINTS.userAdvertisementReviewAction}`, moderator, reviewUserAdvertisementFromRequest);
}
