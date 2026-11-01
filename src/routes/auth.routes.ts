import type { FastifyInstance } from 'fastify';
import { AUTH_RATE_LIMITS } from '../constants/authRateLimit.constant.js';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import {
  changeAccountPasswordFromRequest,
  getCurrentAccountFromRequest,
  logInAccountFromRequest,
  logOutAccountFromRequest,
  logOutAllAccountSessionsFromRequest,
  refreshAccountSessionFromRequest,
  registerLandlordAccountFromRequest,
  registerStudentAccountFromRequest,
} from '../controllers/auth.controller.js';
import { registerBusinessAdvertiserFromRequest } from '../controllers/businessAdvertiser.controller.js';
import { registerCaretakerAccountFromRequest } from '../controllers/caretakerAuth.controller.js';
import { requireAuthenticatedUser } from '../middlewares/authentication.middleware.js';
import {
  requestPasswordResetCodeFromRequest,
  resetAccountPasswordFromRequest,
  verifyPasswordResetCodeFromRequest,
} from '../controllers/authRecovery.controller.js';

export async function registerAuthenticationRoutes(fastifyApplication: FastifyInstance): Promise<void> {
  fastifyApplication.addHook('onSend', async (_fastifyRequest, fastifyReply, responsePayload) => {
    fastifyReply.header('cache-control', 'no-store');
    fastifyReply.header('pragma', 'no-cache');
    return responsePayload;
  });
  fastifyApplication.post(API_ENDPOINTS.registerStudent, { config: { rateLimit: AUTH_RATE_LIMITS.registration } }, registerStudentAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.registerLandlord, { config: { rateLimit: AUTH_RATE_LIMITS.registration } }, registerLandlordAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.registerBusinessAdvertiser, { config: { rateLimit: AUTH_RATE_LIMITS.registration } }, registerBusinessAdvertiserFromRequest);
  fastifyApplication.post(API_ENDPOINTS.registerCaretaker, { config: { rateLimit: AUTH_RATE_LIMITS.registration } }, registerCaretakerAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.signIn, { config: { rateLimit: AUTH_RATE_LIMITS.login } }, logInAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.requestPasswordReset, { config: { rateLimit: AUTH_RATE_LIMITS.recoveryRequest } }, requestPasswordResetCodeFromRequest);
  fastifyApplication.post(API_ENDPOINTS.verifyPasswordResetCode, { config: { rateLimit: AUTH_RATE_LIMITS.recoveryVerify } }, verifyPasswordResetCodeFromRequest);
  fastifyApplication.post(API_ENDPOINTS.confirmPasswordReset, { config: { rateLimit: AUTH_RATE_LIMITS.recoveryConfirm } }, resetAccountPasswordFromRequest);
  fastifyApplication.post(API_ENDPOINTS.refreshSession, { config: { rateLimit: AUTH_RATE_LIMITS.refresh } }, refreshAccountSessionFromRequest);
  fastifyApplication.post(API_ENDPOINTS.signOut, { preHandler: requireAuthenticatedUser }, logOutAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.signOutAll, { preHandler: requireAuthenticatedUser }, logOutAllAccountSessionsFromRequest);
  fastifyApplication.get(API_ENDPOINTS.currentUser, { preHandler: requireAuthenticatedUser }, getCurrentAccountFromRequest);
  fastifyApplication.post(API_ENDPOINTS.changePassword, { preHandler: requireAuthenticatedUser }, changeAccountPasswordFromRequest);
}
