import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { RENTAL_APPLICATION_RATE_LIMITS } from '../constants/rentalApplication.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { createStudentApplication, decideRentalApplication, getLandlordApplications, getStudentApplications, withdrawStudentApplication } from '../controllers/rentalApplication.controller.js';
import { requireAccountRole, requireAuthenticatedUser } from '../middlewares/index.js';

export async function registerRentalApplicationRoutes(application: FastifyInstance): Promise<void> {
  const student = [requireAuthenticatedUser, requireAccountRole(UserRole.STUDENT)];
  const landlord = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  application.get(API_ENDPOINTS.rentalApplications, { preHandler: student }, getStudentApplications);
  application.post(API_ENDPOINTS.rentalApplications, { preHandler: student, config: { rateLimit: { max: RENTAL_APPLICATION_RATE_LIMITS.submitMaximum, timeWindow: RENTAL_APPLICATION_RATE_LIMITS.submitWindow, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, createStudentApplication);
  application.post(`${API_ENDPOINTS.rentalApplications}${API_ENDPOINTS.rentalApplicationWithdrawAction}`, { preHandler: student }, withdrawStudentApplication);
  application.get(API_ENDPOINTS.landlordRentalApplications, { preHandler: landlord }, getLandlordApplications);
  application.post(`${API_ENDPOINTS.landlordRentalApplications}${API_ENDPOINTS.rentalApplicationResponseAction}`, { preHandler: landlord, config: { rateLimit: { max: RENTAL_APPLICATION_RATE_LIMITS.decisionMaximum, timeWindow: RENTAL_APPLICATION_RATE_LIMITS.decisionWindow, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } } }, decideRentalApplication);
}
