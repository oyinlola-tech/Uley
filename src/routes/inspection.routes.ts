import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { requireAuthenticatedUser, requireAccountRole } from '../middlewares/index.js';
import { createInspectionRequest, getLandlordInspectionRequests, getMyInspectionRequests, getSharedInspectionLocation, respondToInspection, startSharingInspectionLocation, stopSharingInspectionLocation, updateSharedInspectionLocation } from '../controllers/inspection.controller.js';

export async function registerInspectionRoutes(application: FastifyInstance): Promise<void> {
  const studentOnly = [requireAuthenticatedUser, requireAccountRole(UserRole.STUDENT)];
  const landlordOnly = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  application.post(API_ENDPOINTS.inspections, { preHandler: studentOnly }, createInspectionRequest);
  application.get(API_ENDPOINTS.inspections, { preHandler: studentOnly }, getMyInspectionRequests);
  application.get(API_ENDPOINTS.landlordInspections, { preHandler: landlordOnly }, getLandlordInspectionRequests);
  application.post(`${API_ENDPOINTS.landlordInspections}${API_ENDPOINTS.inspectionResponseAction}`, { preHandler: landlordOnly }, respondToInspection);
  application.post(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionLocationShareAction}`, { preHandler: studentOnly }, startSharingInspectionLocation);
  application.delete(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionLocationShareAction}`, { preHandler: studentOnly }, stopSharingInspectionLocation);
  application.put(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionLocationAction}`, { preHandler: studentOnly }, updateSharedInspectionLocation);
  application.get(`${API_ENDPOINTS.inspections}${API_ENDPOINTS.inspectionLocationAction}`, { preHandler: [requireAuthenticatedUser] }, getSharedInspectionLocation);
}
