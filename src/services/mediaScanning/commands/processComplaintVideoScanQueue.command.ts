import type { FastifyInstance } from 'fastify';
import { AppError } from '../../../errors/app.error.js';
import { PropertyImageScanStatus } from '@prisma/client';
import { claimComplaintVideoScanJob, completeComplaintVideoScanJob, updateComplaintVideoScanFailure } from '../../../repositories/complaintVideoScanJob.repository.js';
import { COMPLAINT_VIDEO_SCAN_QUEUE } from '../../../constants/mediaService.constant.js';
import { deleteStoredComplaintMedia } from './deleteStoredComplaintMedia.command.js';
import { scanAndStoreComplaintVideo } from './scanAndStoreComplaintVideo.command.js';

export function startComplaintVideoScanQueue(application: FastifyInstance): void {
  const processNextJob = () => { void processOneComplaintVideoScan(application).catch((error: unknown) => application.log.error({ err: error }, 'Complaint video scan queue failed')); };
  const timer = setInterval(processNextJob, COMPLAINT_VIDEO_SCAN_QUEUE.pollIntervalMilliseconds);
  timer.unref();
  application.addHook('onClose', async () => clearInterval(timer));
  processNextJob();
}

async function processOneComplaintVideoScan(application: FastifyInstance): Promise<void> {
  const now = new Date();
  const job = await claimComplaintVideoScanJob(now, new Date(now.getTime() + COMPLAINT_VIDEO_SCAN_QUEUE.leaseDurationMilliseconds));
  if (!job) return;
  if (!job.sourceBytes) {
    await updateComplaintVideoScanFailure(job.id, PropertyImageScanStatus.FAILED, null, 'SCAN_PAYLOAD_MISSING');
    return;
  }
  let scanned: Awaited<ReturnType<typeof scanAndStoreComplaintVideo>> | null = null;
  try {
    scanned = await scanAndStoreComplaintVideo(job.complaintId, Buffer.from(job.sourceBytes), job.contentType, job.fileName);
    await completeComplaintVideoScanJob(job.id, { complaintId: job.complaintId, uploaderId: job.uploaderId, fileName: job.fileName, ...scanned });
  } catch (error) {
    if (scanned) await Promise.allSettled([deleteStoredComplaintMedia(scanned.videoStorageKey), deleteStoredComplaintMedia(scanned.posterStorageKey)]);
    const permanent = error instanceof AppError && error.statusCode < 500;
    const retry = !permanent && job.attempts < COMPLAINT_VIDEO_SCAN_QUEUE.maximumAttempts;
    const delay = Math.min(1_000 * 2 ** Math.min(job.attempts, 12), COMPLAINT_VIDEO_SCAN_QUEUE.maximumRetryDelayMilliseconds);
    const status = permanent ? PropertyImageScanStatus.REJECTED : retry ? PropertyImageScanStatus.RETRYING : PropertyImageScanStatus.FAILED;
    await updateComplaintVideoScanFailure(job.id, status, retry ? new Date(Date.now() + delay) : null, error instanceof AppError ? error.code : 'MEDIA_SCAN_UNAVAILABLE');
    if (retry) application.log.warn({ uploadId: job.uploadId, attempt: job.attempts }, 'Complaint video scan will retry');
  }
}
