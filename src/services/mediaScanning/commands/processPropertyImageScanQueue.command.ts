import { AppError } from '../../../errors/app.error.js';
import { PropertyImageScanStatus } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { prismaDatabaseClient } from '../../../database/prisma.database.js';
import { PROPERTY_IMAGE_SCAN_QUEUE } from '../../../constants/mediaService.constant.js';
import { addScannedPropertyImage } from '../../../repositories/propertyImage.repository.js';

const dueQueueStatuses = [PropertyImageScanStatus.QUEUED, PropertyImageScanStatus.RETRYING];

export function startPropertyImageScanQueue(application: FastifyInstance): void {
  const processNextScanJob = () => { void claimAndProcessNextScanJob(application).catch((error: unknown) => application.log.error({ err: error }, 'Property image scan queue failed')); };
  const timer = setInterval(processNextScanJob, PROPERTY_IMAGE_SCAN_QUEUE.pollIntervalMilliseconds);
  timer.unref();
  application.addHook('onClose', async () => clearInterval(timer));
  processNextScanJob();
}

async function claimAndProcessNextScanJob(application: FastifyInstance): Promise<void> {
  const now = new Date();
  const candidate = await prismaDatabaseClient.propertyImageScanJob.findFirst({
    where: { OR: [
      { status: { in: dueQueueStatuses }, nextAttemptAt: { lte: now } },
      { status: PropertyImageScanStatus.PROCESSING, leaseExpiresAt: { lte: now } },
    ] }, orderBy: { createdAt: 'asc' },
  });
  if (!candidate) return;
  const claim = await prismaDatabaseClient.propertyImageScanJob.updateMany({
    where: { id: candidate.id, status: candidate.status, updatedAt: candidate.updatedAt },
    data: { status: PropertyImageScanStatus.PROCESSING, attempts: { increment: 1 }, leaseExpiresAt: new Date(now.getTime() + PROPERTY_IMAGE_SCAN_QUEUE.leaseDurationMilliseconds), lastErrorCode: null },
  });
  if (!claim.count) return;
  const job = await prismaDatabaseClient.propertyImageScanJob.findUnique({ where: { id: candidate.id } });
  if (!job) return;
  if (!job.sourceBytes) {
    await prismaDatabaseClient.propertyImageScanJob.update({ where: { id: job.id }, data: { status: PropertyImageScanStatus.FAILED, leaseExpiresAt: null, lastErrorCode: 'SCAN_PAYLOAD_MISSING' } });
    return;
  }
  try {
    const image = await addScannedPropertyImage({
      propertyId: job.propertyId, landlordId: job.landlordId, bytes: Buffer.from(job.sourceBytes),
      contentType: job.contentType, fileName: job.fileName, altText: job.altText, clientUploadId: job.uploadId,
    });
    await prismaDatabaseClient.propertyImageScanJob.update({
      where: { id: job.id }, data: { status: PropertyImageScanStatus.COMPLETED, sourceBytes: null, propertyImageId: image.id, leaseExpiresAt: null, lastErrorCode: null },
    });
  } catch (scanError) { await recordScanFailure(job.id, job.attempts, scanError); }
}

async function recordScanFailure(jobId: string, attempts: number, scanError: unknown): Promise<void> {
  const isPermanentFailure = scanError instanceof AppError && scanError.statusCode < 500;
  const hasExhaustedRetries = attempts >= PROPERTY_IMAGE_SCAN_QUEUE.maximumAttempts;
  const shouldRetry = !isPermanentFailure && !hasExhaustedRetries;
  const retryDelay = Math.min(1_000 * 2 ** Math.min(attempts, 12), PROPERTY_IMAGE_SCAN_QUEUE.maximumRetryDelayMilliseconds);
  await prismaDatabaseClient.propertyImageScanJob.update({ where: { id: jobId }, data: {
    status: isPermanentFailure ? PropertyImageScanStatus.REJECTED : shouldRetry ? PropertyImageScanStatus.RETRYING : PropertyImageScanStatus.FAILED,
    ...(!shouldRetry ? { sourceBytes: null } : {}), leaseExpiresAt: null,
    ...(shouldRetry ? { nextAttemptAt: new Date(Date.now() + retryDelay) } : {}),
    lastErrorCode: scanError instanceof AppError ? scanError.code : 'MEDIA_SCAN_UNAVAILABLE',
  } });
}
