import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { PROPERTY_REPORT_RATE_LIMIT } from '../constants/propertyReport.constant.js';
import { ADMIN_ROLE_PERMISSIONS } from '../constants/adminRole.constant.js';
import { requireAuthenticatedUser, requireOneOfAccountRoles } from '../middlewares/index.js';
import { getPendingVerificationReviews, reviewLandlordVerificationFromRequest, reviewPropertyVerificationFromRequest } from '../controllers/admin.controller.js';
import { getSystemLogs } from '../controllers/systemLog.controller.js';
import { createPropertyReport, getAdminAccounts, getAdminDashboard, getAdminInspections, getAdminProperties, getOpenPropertyReports, reviewPropertyReportFromRequest, updateAdminAccountStatus, updateAdminPropertyStatus, getAdminStaff, createAdminStaffFromRequest, updateAdminStaffStatus } from '../controllers/adminDashboard.controller.js';
import { decideHomeReview, getHomeReviewQueue } from '../controllers/inspectionLifecycle.controller.js';
import { decideFlaggedMessageFromRequest, getContentModerationQueue, reviewContentReportFromRequest, reviewMessageAppealFromRequest } from '../controllers/conversation.controller.js';

export async function registerAdminRoutes(application: FastifyInstance): Promise<void> {
  const allowedAdminRoles = (roles: readonly import('../enums/userRole.enum.js').UserRole[]) => [requireAuthenticatedUser, requireOneOfAccountRoles(roles)];
  const signedInOnly = [requireAuthenticatedUser];
  application.get(API_ENDPOINTS.adminDashboard, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.dashboard) }, getAdminDashboard);
  application.get(API_ENDPOINTS.adminSystemLogs, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.systemLogs) }, getSystemLogs);
  application.get(API_ENDPOINTS.adminInspections, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.inspections) }, getAdminInspections);
  application.get(API_ENDPOINTS.adminPendingReviews, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.verification) }, getPendingVerificationReviews);
  application.get(API_ENDPOINTS.adminHomeReviews, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.verification) }, getHomeReviewQueue);
  application.post(`${API_ENDPOINTS.adminHomeReviews}${API_ENDPOINTS.adminHomeReviewAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.verification) }, decideHomeReview);
  application.get(API_ENDPOINTS.adminContentReports, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.contentModeration) }, getContentModerationQueue);
  application.post(`${API_ENDPOINTS.adminContentReports}${API_ENDPOINTS.adminContentReportAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.contentModeration) }, reviewContentReportFromRequest);
  application.post(`${API_ENDPOINTS.adminFlaggedMessages}${API_ENDPOINTS.adminFlaggedMessageAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.contentModeration) }, decideFlaggedMessageFromRequest);
  application.post(`${API_ENDPOINTS.adminMessageAppeals}${API_ENDPOINTS.adminMessageAppealAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.contentModeration) }, reviewMessageAppealFromRequest);
  application.post(`${API_ENDPOINTS.adminPendingReviews}${API_ENDPOINTS.adminLandlordReviews}${API_ENDPOINTS.landlordVerificationReview}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.verification) }, reviewLandlordVerificationFromRequest);
  application.post(`${API_ENDPOINTS.adminPendingReviews}${API_ENDPOINTS.adminPropertyReviews}${API_ENDPOINTS.propertyVerificationReview}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.verification) }, reviewPropertyVerificationFromRequest);
  application.get(API_ENDPOINTS.adminAccounts, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.accounts) }, getAdminAccounts);
  application.post(`${API_ENDPOINTS.adminAccounts}${API_ENDPOINTS.adminAccountStatusAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.accounts) }, updateAdminAccountStatus);
  application.get(API_ENDPOINTS.adminProperties, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.safety) }, getAdminProperties);
  application.post(`${API_ENDPOINTS.adminProperties}${API_ENDPOINTS.adminPropertyStatusAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.safety) }, updateAdminPropertyStatus);
  application.get(API_ENDPOINTS.adminReports, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.safety) }, getOpenPropertyReports);
  application.post(`${API_ENDPOINTS.adminReports}${API_ENDPOINTS.adminReportReviewAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.safety) }, reviewPropertyReportFromRequest);
  application.get(API_ENDPOINTS.adminStaff, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.staffManagement) }, getAdminStaff);
  application.post(API_ENDPOINTS.adminStaff, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.staffManagement) }, createAdminStaffFromRequest);
  application.post(`${API_ENDPOINTS.adminStaff}${API_ENDPOINTS.adminStaffStatusAction}`, { preHandler: allowedAdminRoles(ADMIN_ROLE_PERMISSIONS.staffManagement) }, updateAdminStaffStatus);
  application.post(API_ENDPOINTS.propertyReports, { config: { rateLimit: PROPERTY_REPORT_RATE_LIMIT }, preHandler: signedInOnly }, createPropertyReport);
}
