import { OccupancyStatus, RentalApplicationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function changeLandlordUnitAvailability(input: { unitId: string; landlordId: string; isAvailable: boolean }) {
  const unit = await prismaDatabaseClient.propertyUnit.findFirst({
    where: { id: input.unitId, property: { landlordId: input.landlordId } },
    select: { id: true },
  });
  if (!unit) throw new NotFoundError(ERROR_MESSAGES.propertyUnitNotFound);
  if (input.isAvailable) {
    const occupancy = await prismaDatabaseClient.occupancy.findFirst({ where: { unitId: input.unitId, status: OccupancyStatus.ACTIVE }, select: { id: true } });
    if (occupancy) throw new ConflictError(ERROR_MESSAGES.propertyUnitHasActiveOccupancy);
    const pendingMoveIn = await prismaDatabaseClient.occupancy.findFirst({ where: { unitId: input.unitId, status: OccupancyStatus.REQUESTED }, select: { id: true } });
    const approvedApplication = await prismaDatabaseClient.rentalApplication.findFirst({ where: { unitId: input.unitId, status: RentalApplicationStatus.APPROVED }, select: { id: true } });
    if (pendingMoveIn || approvedApplication) throw new ConflictError(ERROR_MESSAGES.propertyUnitHasPendingOccupancy);
  }
  return prismaDatabaseClient.propertyUnit.update({ where: { id: input.unitId }, data: { isAvailable: input.isAvailable }, select: { id: true, name: true, isAvailable: true } });
}
