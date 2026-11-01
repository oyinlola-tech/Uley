import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { COMPLAINT_LIMITS } from '../constants/complaint.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { ADMIN_ROLE_PERMISSIONS } from '../constants/adminRole.constant.js';
import { requireAccountRole, requireAuthenticatedUser, requireOneOfAccountRoles } from '../middlewares/index.js';
import { addComplaintMessage, confirmComplaintResolution, createComplaint, escalateComplaint, getMyComplaints, getSchoolComplaints, getComplaintVideoEvidenceStatus, updateLandlordComplaint, updateSchoolComplaint, uploadComplaintVideoEvidence } from '../controllers/complaintWorkflow.controller.js';

export async function registerComplaintRoutes(application: FastifyInstance): Promise<void> {
  const student = [requireAuthenticatedUser, requireAccountRole(UserRole.STUDENT)];
  const landlord = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  const school = [requireAuthenticatedUser, requireOneOfAccountRoles(ADMIN_ROLE_PERMISSIONS.complaints)];
  const caretaker = [requireAuthenticatedUser, requireAccountRole(UserRole.CARETAKER)];
  const participants = [requireAuthenticatedUser, requireOneOfAccountRoles([UserRole.STUDENT, UserRole.LANDLORD, UserRole.CARETAKER, ...ADMIN_ROLE_PERMISSIONS.complaints])];
  application.get(API_ENDPOINTS.complaints, { preHandler: student }, getMyComplaints);
  application.post(API_ENDPOINTS.complaints, { preHandler: student, config: { rateLimit: { max: COMPLAINT_LIMITS.createRateLimitMaximum, timeWindow: COMPLAINT_LIMITS.createRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, createComplaint);
  application.post(`${API_ENDPOINTS.complaints}${API_ENDPOINTS.complaintConfirmResolution}`, { preHandler: student }, confirmComplaintResolution);
  application.post(`${API_ENDPOINTS.complaints}${API_ENDPOINTS.complaintEscalate}`, { preHandler: student }, escalateComplaint);
  application.post(`${API_ENDPOINTS.complaints}${API_ENDPOINTS.complaintMessages}`, { preHandler: participants, config: { rateLimit: { max: COMPLAINT_LIMITS.messageRateLimitMaximum, timeWindow: COMPLAINT_LIMITS.messageRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, addComplaintMessage);
  application.post(`${API_ENDPOINTS.complaints}${API_ENDPOINTS.complaintVideoEvidence}`, { preHandler: student, config: { rateLimit: { max: COMPLAINT_LIMITS.evidenceVideoUploadRateLimitMaximum, timeWindow: COMPLAINT_LIMITS.evidenceVideoUploadRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, uploadComplaintVideoEvidence);
  application.get(`${API_ENDPOINTS.complaints}${API_ENDPOINTS.complaintVideoEvidenceStatus}`, { preHandler: participants }, getComplaintVideoEvidenceStatus);
  application.get(API_ENDPOINTS.landlordComplaints, { preHandler: landlord }, getMyComplaints);
  application.post(`${API_ENDPOINTS.landlordComplaints}${API_ENDPOINTS.complaintLandlordResponse}`, { preHandler: landlord }, updateLandlordComplaint);
  application.get(API_ENDPOINTS.caretakerComplaints, { preHandler: caretaker }, getMyComplaints);
  application.post(`${API_ENDPOINTS.caretakerComplaints}${API_ENDPOINTS.complaintLandlordResponse}`, { preHandler: caretaker }, updateLandlordComplaint);
  application.get(API_ENDPOINTS.adminComplaints, { preHandler: school }, getSchoolComplaints);
  application.post(`${API_ENDPOINTS.adminComplaints}${API_ENDPOINTS.complaintAdminResponse}`, { preHandler: school }, updateSchoolComplaint);
}
