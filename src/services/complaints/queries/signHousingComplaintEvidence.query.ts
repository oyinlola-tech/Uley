import { createSignedComplaintMediaUrls } from '../../mediaScanning/index.js';
type ComplaintEvidenceRecord = { id: string; videoStorageKey: string; posterStorageKey: string; fileName: string; sizeBytes: number; durationSeconds: number; createdAt: Date };
type ComplaintWithEvidence = { evidence: ComplaintEvidenceRecord[] };

export async function signHousingComplaintEvidence<T extends ComplaintWithEvidence>(complaints: T[]) {
  const keys = complaints.flatMap((complaint) => complaint.evidence.flatMap((evidence) => [evidence.videoStorageKey, evidence.posterStorageKey]));
  const urls = await createSignedComplaintMediaUrls(keys);
  return complaints.map((complaint) => ({
    ...complaint,
    evidence: complaint.evidence.map((evidence) => ({
      id: evidence.id, fileName: evidence.fileName, sizeBytes: evidence.sizeBytes, durationSeconds: evidence.durationSeconds,
      createdAt: evidence.createdAt, videoUrl: urls[evidence.videoStorageKey], posterUrl: urls[evidence.posterStorageKey],
    })),
  }));
}
