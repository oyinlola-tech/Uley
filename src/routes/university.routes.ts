import type { FastifyInstance } from 'fastify';
import { getRegistrationUniversities } from '../controllers/university.controller.js';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';

export async function registerUniversityRoutes(application: FastifyInstance): Promise<void> {
  application.get(API_ENDPOINTS.universities, getRegistrationUniversities);
}
