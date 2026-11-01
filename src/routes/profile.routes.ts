import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { requireAuthenticatedUser } from '../middlewares/index.js';
import { findRoommateProfiles, getMyProfile, getPublicProfile, startProfileConversation, updateMyProfile } from '../controllers/profile.controller.js';

export async function registerProfileRoutes(application: FastifyInstance): Promise<void> {
  const signedIn = [requireAuthenticatedUser];
  application.get(API_ENDPOINTS.profiles, { preHandler: signedIn }, findRoommateProfiles);
  application.get(`${API_ENDPOINTS.profiles}/me`, { preHandler: signedIn }, getMyProfile);
  application.put(`${API_ENDPOINTS.profiles}/me`, { preHandler: signedIn }, updateMyProfile);
  application.get(`${API_ENDPOINTS.profiles}/:profileId`, { preHandler: signedIn }, getPublicProfile);
  application.post(`${API_ENDPOINTS.profiles}/:profileId/contact`, { preHandler: signedIn }, startProfileConversation);
}
