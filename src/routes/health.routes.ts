import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import {
  getApiLivenessStatus,
  getApiReadinessStatus,
} from '../controllers/health.controller.js';

export async function registerHealthRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.get(API_ENDPOINTS.healthLiveness, getApiLivenessStatus);
  fastifyApplication.get(API_ENDPOINTS.healthReadiness, getApiReadinessStatus);
}
