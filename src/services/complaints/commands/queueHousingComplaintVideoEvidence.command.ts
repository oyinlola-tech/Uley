import { randomUUID } from 'node:crypto';
import { createComplaintVideoScanJob } from '../../../repositories/complaintVideoScanJob.repository.js';

export async function queueHousingComplaintVideoEvidence(input: { complaintId: string; studentId: string; fileName: string; videoBytes: Buffer; contentType: string }) {
  const job = await createComplaintVideoScanJob({ uploadId: randomUUID(), complaintId: input.complaintId, studentId: input.studentId, fileName: input.fileName, contentType: input.contentType, sourceBytes: input.videoBytes });
  return { uploadId: job.uploadId, scanStatus: job.status, createdAt: job.createdAt };
}
