import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { PROPERTY_LISTING_RATE_LIMIT } from '../constants/propertyListing.constant.js';
import { getPublicPropertyListings } from '../controllers/property.controller.js';
import { getHomeReviews } from '../controllers/inspectionLifecycle.controller.js';
import { getPublicPropertyDetailById } from '../controllers/propertyDetail.controller.js';

export async function registerPropertyRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.get(API_ENDPOINTS.propertyListings, { config: { rateLimit: PROPERTY_LISTING_RATE_LIMIT } }, getPublicPropertyListings);
  fastifyApplication.get(`${API_ENDPOINTS.propertyListings}${API_ENDPOINTS.publicPropertyDetail}`, { config: { rateLimit: PROPERTY_LISTING_RATE_LIMIT } }, getPublicPropertyDetailById);
  fastifyApplication.get(`${API_ENDPOINTS.propertyListings}${API_ENDPOINTS.propertyPublicReviews}`, getHomeReviews);
}
