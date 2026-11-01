import { getComplaintVideoScanStatus } from '../../../repositories/complaintVideoScanJob.repository.js';
import { createSignedComplaintMediaUrls } from '../../mediaScanning/index.js';
import type { UserRole } from '../../../enums/userRole.enum.js';

export async function getHousingComplaintVideoScanStatus(input: { uploadId: string; complaintId: string; actorId: string; actorRole: UserRole }) {
  const job = await getComplaintVideoScanStatus(input.uploadId, input.complaintId, input.actorId, input.actorRole);
  if (!job.evidence) return { uploadId: job.uploadId, scanStatus: job.status, errorCode: job.lastErrorCode, createdAt: job.createdAt, evidence: null };
  const urls = await createSignedComplaintMediaUrls([job.evidence.videoStorageKey, job.evidence.posterStorageKey]);
  return { uploadId: job.uploadId, scanStatus: job.status, errorCode: null, createdAt: job.createdAt, evidence: {
    id: job.evidence.id, fileName: job.evidence.fileName, sizeBytes: job.evidence.sizeBytes, durationSeconds: job.evidence.durationSeconds,
    createdAt: job.evidence.createdAt, videoUrl: urls[job.evidence.videoStorageKey], posterUrl: urls[job.evidence.posterStorageKey],
  } };
}
