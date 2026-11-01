import { markInspectionMissed } from '../../../repositories/inspectionLifecycle.repository.js';

export async function reportMissedInspection(input: { inspectionId: string; actorId: string; isLandlord: boolean }) {
  return markInspectionMissed(input);
}
