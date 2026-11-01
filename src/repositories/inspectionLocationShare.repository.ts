import { InspectionStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { InspectionLocationAccessDto, UpdateInspectionLocationDto } from '../dtos/inspectionLocationShare.dto.js';

const ACTIVE_INSPECTION_WINDOW_MILLISECONDS = 6 * 60 * 60 * 1000;
const LOCATION_FRESHNESS_MILLISECONDS = 2 * 60 * 1000;

export async function startInspectionLocationShare(input: InspectionLocationAccessDto) {
  const now = new Date();
  const inspection = await prismaDatabaseClient.inspection.findFirst({
    where: {
      id: input.inspectionId,
      studentId: input.participantId,
      status: InspectionStatus.CONFIRMED,
      scheduledFor: { gte: new Date(now.getTime() - ACTIVE_INSPECTION_WINDOW_MILLISECONDS), lte: new Date(now.getTime() + ACTIVE_INSPECTION_WINDOW_MILLISECONDS) },
    }, select: { id: true },
  });
  if (!inspection) return null;
  return prismaDatabaseClient.inspectionLocationShare.upsert({
    where: { inspectionId: input.inspectionId },
    create: { inspectionId: input.inspectionId },
    update: { sharingStartedAt: now, sharingStoppedAt: null, latitude: null, longitude: null, locationUpdatedAt: null },
  });
}

export async function updateInspectionLocation(input: UpdateInspectionLocationDto) {
  const now = new Date();
  const currentShare = await prismaDatabaseClient.inspectionLocationShare.findFirst({
    where: {
      inspectionId: input.inspectionId,
      sharingStoppedAt: null,
      inspection: {
        studentId: input.participantId,
        status: InspectionStatus.CONFIRMED,
        scheduledFor: { gte: new Date(now.getTime() - ACTIVE_INSPECTION_WINDOW_MILLISECONDS), lte: new Date(now.getTime() + ACTIVE_INSPECTION_WINDOW_MILLISECONDS) },
      },
    },
    select: { id: true },
  });
  if (!currentShare) return null;
  return prismaDatabaseClient.inspectionLocationShare.update({
    where: { id: currentShare.id }, data: { latitude: input.latitude, longitude: input.longitude, locationUpdatedAt: new Date() },
  });
}

export async function stopInspectionLocationShare(input: InspectionLocationAccessDto) {
  const stopped = await prismaDatabaseClient.inspectionLocationShare.updateMany({
    where: { inspectionId: input.inspectionId, sharingStoppedAt: null, inspection: { studentId: input.participantId } },
    data: { sharingStoppedAt: new Date(), latitude: null, longitude: null, locationUpdatedAt: null },
  });
  return stopped.count > 0;
}

export async function findInspectionSharedLocation(input: InspectionLocationAccessDto) {
  const staleLocationCutoff = new Date(Date.now() - LOCATION_FRESHNESS_MILLISECONDS);
  const expiredAt = new Date();
  await prismaDatabaseClient.inspectionLocationShare.updateMany({
    where: {
      inspectionId: input.inspectionId,
      sharingStoppedAt: null,
      OR: [
        { locationUpdatedAt: { lt: staleLocationCutoff } },
        { locationUpdatedAt: null, sharingStartedAt: { lt: staleLocationCutoff } },
      ],
    },
    data: { sharingStoppedAt: expiredAt, latitude: null, longitude: null, locationUpdatedAt: null },
  });
  const share = await prismaDatabaseClient.inspectionLocationShare.findFirst({
    where: {
      inspectionId: input.inspectionId,
      sharingStoppedAt: null,
      inspection: { OR: [{ studentId: input.participantId }, { property: { landlordId: input.participantId } }], status: InspectionStatus.CONFIRMED },
    }, select: { latitude: true, longitude: true, locationUpdatedAt: true, sharingStartedAt: true },
  });
  const locationIsFresh = share?.locationUpdatedAt && Date.now() - share.locationUpdatedAt.getTime() <= LOCATION_FRESHNESS_MILLISECONDS;
  return { sharing: Boolean(share), location: locationIsFresh ? { latitude: share.latitude, longitude: share.longitude, updatedAt: share.locationUpdatedAt } : null };
}
