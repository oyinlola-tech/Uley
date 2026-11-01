import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { requireAccountRole, requireAuthenticatedUser } from '../middlewares/index.js';
import { answerOccupancyRequest, getLandlordOccupancyRequests, getStudentOccupancies, markVisitMissed, requestReschedule, respondToReschedule, submitHomeReview, submitVisitFeedback } from '../controllers/inspectionLifecycle.controller.js';

export async function registerInspectionLifecycleRoutes(application: FastifyInstance): Promise<void> {
  const student = [requireAuthenticatedUser, requireAccountRole(UserRole.STUDENT)];
  const landlord = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  application.post(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionRescheduleAction}`, { preHandler: student }, requestReschedule);
  application.post(`${API_ENDPOINTS.landlordInspections}${API_ENDPOINTS.inspectionRescheduleResponseAction}`, { preHandler: landlord }, respondToReschedule);
  application.post(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionMissedAction}`, { preHandler: student }, markVisitMissed);
  application.post(`${API_ENDPOINTS.landlordInspections}${API_ENDPOINTS.inspectionMissedAction}`, { preHandler: landlord }, markVisitMissed);
  application.post(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionFeedbackAction}`, { preHandler: student }, submitVisitFeedback);
  application.get(API_ENDPOINTS.studentOccupancies, { preHandler: student }, getStudentOccupancies);
  application.get(API_ENDPOINTS.landlordOccupancies, { preHandler: landlord }, getLandlordOccupancyRequests);
  application.post(`${API_ENDPOINTS.landlordOccupancies}${API_ENDPOINTS.occupancyResponseAction}`, { preHandler: landlord }, answerOccupancyRequest);
  application.post(API_ENDPOINTS.occupancyReviews, { preHandler: student }, submitHomeReview);
}
