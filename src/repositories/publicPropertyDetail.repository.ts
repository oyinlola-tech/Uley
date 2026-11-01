import { OccupancyStatus, PropertyStatus, RentalApplicationStatus, UserRole, VerificationStatus } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';

export async function findPublicPropertyDetail(propertyId: string) {
  const property = await prismaDatabaseClient.property.findFirst({
    where: {
      id: propertyId,
      status: PropertyStatus.PUBLISHED,
      verification: { is: { status: VerificationStatus.APPROVED } },
      landlord: {
        role: UserRole.LANDLORD,
        isActive: true,
        landlordVerification: { is: { status: VerificationStatus.APPROVED } },
      },
      units: { some: { isAvailable: true, occupancies: { none: { status: { in: [OccupancyStatus.REQUESTED, OccupancyStatus.ACTIVE] } } }, rentalApplications: { none: { status: RentalApplicationStatus.APPROVED } } } },
    },
    select: {
      id: true, name: true, description: true, streetAddress: true,
      neighborhood: true, city: true, state: true, createdAt: true,
      university: { select: { id: true, name: true } },
      landlord: { select: { id: true, fullName: true, createdAt: true } },
      units: {
        where: { isAvailable: true, occupancies: { none: { status: { in: [OccupancyStatus.REQUESTED, OccupancyStatus.ACTIVE] } } }, rentalApplications: { none: { status: RentalApplicationStatus.APPROVED } } }, orderBy: [{ rentAmount: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true, name: true, rentAmount: true, rentalPeriod: true,
          securityDeposit: true, monthlyServiceCharge: true, inspectionFee: true,
          bedrooms: true, bathrooms: true,
        },
      },
      images: { orderBy: { displayOrder: 'asc' }, take: 12, select: { storageKey: true, altText: true } },
      reviews: {
        where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 12,
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
    },
  });
  if (!property) return null;
  const reviewAggregate = await prismaDatabaseClient.propertyReview.aggregate({
    where: { propertyId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return { ...property, reviewSummary: { averageRating: reviewAggregate._avg.rating, reviewCount: reviewAggregate._count._all } };
}
