import type { FastifyInstance } from 'fastify';
import { API_ENDPOINTS } from '../constants/apiEndpoint.constant.js';
import { UserRole } from '../enums/userRole.enum.js';
import { requireAuthenticatedUser, requireAccountRole } from '../middlewares/index.js';
import { assignMyPropertyCaretaker, createMyProperty, getMyLandlordVerification, getMyProperties, getMyPropertyCaretakers, removeMyPropertyCaretaker, requestMyLandlordVerification, submitMyPropertyForReview, updateMyPropertyDraft } from '../controllers/landlord.controller.js';
import { uploadMyPropertyImage } from '../controllers/propertyImage.controller.js';
import { PROPERTY_IMAGE_LIMITS } from '../constants/propertyImage.constant.js';
import { startPropertyImageUploadFromRequest, uploadPropertyImageChunkFromRequest, getPropertyImageUploadFromRequest, completePropertyImageUploadFromRequest } from '../controllers/propertyImageUpload.controller.js';
import { updateUnitAvailability } from '../controllers/inspectionLifecycle.controller.js';

export async function registerManagementRoutes(application: FastifyInstance): Promise<void> {
  const landlordOnly = [requireAuthenticatedUser, requireAccountRole(UserRole.LANDLORD)];
  application.get(API_ENDPOINTS.landlordVerification, { preHandler: landlordOnly }, getMyLandlordVerification);
  application.post(API_ENDPOINTS.landlordVerification, { preHandler: landlordOnly }, requestMyLandlordVerification);
  application.get(API_ENDPOINTS.landlordProperties, { preHandler: landlordOnly }, getMyProperties);
  application.get(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyCaretakers}`, { preHandler: landlordOnly }, getMyPropertyCaretakers);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyCaretakers}`, { preHandler: landlordOnly }, assignMyPropertyCaretaker);
  application.delete(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyCaretakers}/:caretakerUserId`, { preHandler: landlordOnly }, removeMyPropertyCaretaker);
  application.post(API_ENDPOINTS.landlordProperties, { preHandler: landlordOnly }, createMyProperty);
  application.put(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyById}`, { preHandler: landlordOnly }, updateMyPropertyDraft);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyImages}`, {
    preHandler: landlordOnly,
    config: { rateLimit: { max: PROPERTY_IMAGE_LIMITS.uploadRateLimitMaximum, timeWindow: PROPERTY_IMAGE_LIMITS.uploadRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } },
  }, uploadMyPropertyImage);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyImageUploads}`, {
    preHandler: landlordOnly,
    config: { rateLimit: { max: PROPERTY_IMAGE_LIMITS.uploadRateLimitMaximum, timeWindow: PROPERTY_IMAGE_LIMITS.uploadRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } },
  }, startPropertyImageUploadFromRequest);
  application.get(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyImageUpload}`, { preHandler: landlordOnly }, getPropertyImageUploadFromRequest);
  application.put(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyImageUploadChunk}`, {
    preHandler: landlordOnly,
    config: { rateLimit: { max: PROPERTY_IMAGE_LIMITS.uploadChunkRateLimitMaximum, timeWindow: PROPERTY_IMAGE_LIMITS.uploadRateLimitWindowMilliseconds, keyGenerator: (request) => request.authenticatedUser?.id ?? request.ip } },
  }, uploadPropertyImageChunkFromRequest);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.landlordPropertyImageUploadComplete}`, { preHandler: landlordOnly }, completePropertyImageUploadFromRequest);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.propertySubmitAction}`, { preHandler: landlordOnly }, submitMyPropertyForReview);
  application.post(`${API_ENDPOINTS.landlordProperties}${API_ENDPOINTS.unitAvailabilityAction}`, { preHandler: landlordOnly }, updateUnitAvailability);
}
