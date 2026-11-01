import type { FastifyInstance } from 'fastify';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { PROPERTY_IMAGE_LIMITS } from '../../../constants/propertyImage.constant.js';
import { MediaStorageBackend } from '../../../enums/mediaStorageBackend.enum.js';
import { prismaDatabaseClient } from '../../../database/prisma.database.js';
import { deletePropertyImageUploadSession } from '../../../repositories/propertyImageUploadSession.repository.js';
import { discardSharedPropertyImageUpload } from './sharedPropertyImageUpload.provider.js';

export function startExpiredPropertyImageUploadCleanup(application: FastifyInstance) {
  if (applicationEnvironment.mediaStorageBackend !== MediaStorageBackend.S3) return;
  const cleanupTimer = setInterval(() => {
    void cleanupExpiredSessions(application).catch((error: unknown) => application.log.error({ err: error }, 'Expired image upload cleanup failed'));
  }, PROPERTY_IMAGE_LIMITS.expiredSessionCleanupIntervalMilliseconds);
  cleanupTimer.unref();
  application.addHook('onClose', async () => clearInterval(cleanupTimer));
  void cleanupExpiredSessions(application).catch((error: unknown) => application.log.error({ err: error }, 'Expired image upload cleanup failed'));
}

async function cleanupExpiredSessions(application: FastifyInstance) {
  const expiredSessions = await prismaDatabaseClient.propertyImageUploadSession.findMany({
    where: { expiresAt: { lte: new Date() } }, take: PROPERTY_IMAGE_LIMITS.expiredSessionCleanupBatchSize,
    orderBy: { expiresAt: 'asc' },
  });
  for (const session of expiredSessions) {
    try {
      await discardSharedPropertyImageUpload(session.uploadId, session.providerUploadId);
      await deletePropertyImageUploadSession(session.uploadId);
    } catch (error) {
      application.log.warn({ err: error, uploadId: session.uploadId }, 'Expired image upload will be cleaned up on a later pass');
    }
  }
}
