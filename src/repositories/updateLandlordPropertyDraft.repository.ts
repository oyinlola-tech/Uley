import { Prisma, PropertyStatus } from '@prisma/client';
import type { UpdateLandlordPropertyDto } from '../dtos/propertyManagement.dto.js';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { ConflictError, NotFoundError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export async function updateLandlordPropertyDraft(propertyId: string, landlordId: string, input: UpdateLandlordPropertyDto) {
  return prismaDatabaseClient.$transaction(async (transaction) => {
    const property = await transaction.property.findFirst({
      where: { id: propertyId, landlordId },
      include: { units: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (!property) throw new NotFoundError();
    if (property.status !== PropertyStatus.DRAFT || !property.units[0]) {
      throw new ConflictError(ERROR_MESSAGES.propertyDraftNotEditable);
    }
    const unit = property.units[0];
    const changedRent = Number(unit.rentAmount) !== input.rentAmount || unit.rentalPeriod !== input.rentalPeriod;
    if (changedRent) {
      await transaction.propertyUnitPriceHistory.create({
        data: { unitId: unit.id, previousAmount: unit.rentAmount, newAmount: input.rentAmount, previousPeriod: unit.rentalPeriod, rentalPeriod: input.rentalPeriod },
      });
    }
    return transaction.property.update({
      where: { id: propertyId },
      data: {
        name: input.name, description: input.description, streetAddress: input.streetAddress,
        neighborhood: input.neighborhood, city: input.city, state: input.state,
        latitude: input.latitude ?? null, longitude: input.longitude ?? null,
        units: { update: { where: { id: unit.id }, data: {
          name: input.unitName, rentAmount: input.rentAmount, rentalPeriod: input.rentalPeriod,
          securityDeposit: input.securityDeposit, monthlyServiceCharge: input.monthlyServiceCharge,
          inspectionFee: input.inspectionFee, bedrooms: input.bedrooms, bathrooms: input.bathrooms,
        } } },
      },
      include: { units: true, images: true, verification: true },
    });
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new ConflictError(ERROR_MESSAGES.propertyDraftNotEditable);
    throw error;
  });
}
