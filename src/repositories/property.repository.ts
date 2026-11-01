import { OccupancyStatus, PropertyStatus, RentalApplicationStatus, UserRole, VerificationStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { SearchPublicPropertyListingsDto } from '../dtos/propertyListing.dto.js';
import { findEligibleSponsoredCampaigns } from './sponsoredCampaign.repository.js';

function buildPublicPropertyWhere(query: SearchPublicPropertyListingsDto): Prisma.PropertyWhereInput {
  const rentAmountRange = {
    ...(query.minimumRentAmount !== undefined ? { gte: query.minimumRentAmount } : {}),
    ...(query.maximumRentAmount !== undefined ? { lte: query.maximumRentAmount } : {}),
  };
  const matchedAvailableUnits: Prisma.PropertyUnitWhereInput = {
    isAvailable: true,
    occupancies: { none: { status: { in: [OccupancyStatus.REQUESTED, OccupancyStatus.ACTIVE] } } },
    rentalApplications: { none: { status: RentalApplicationStatus.APPROVED } },
    rentalPeriod: query.rentalPeriod,
    ...(Object.keys(rentAmountRange).length ? { rentAmount: rentAmountRange } : {}),
    ...(query.minimumBedrooms !== undefined ? { bedrooms: { gte: query.minimumBedrooms } } : {}),
  };
  const searchText = query.searchText?.trim();
  const nearbyBounds = getNearbyCoordinateBounds(query);

  return {
    status: PropertyStatus.PUBLISHED,
    ...(query.universityId ? { universityId: query.universityId } : {}),
    ...(nearbyBounds ? { latitude: nearbyBounds.latitude, longitude: nearbyBounds.longitude } : {}),
    verification: { is: { status: VerificationStatus.APPROVED } },
    landlord: {
      role: UserRole.LANDLORD,
      isActive: true,
      landlordVerification: { is: { status: VerificationStatus.APPROVED } },
    },
    units: { some: matchedAvailableUnits },
    ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
    ...(searchText ? {
      OR: ['name', 'description', 'streetAddress', 'neighborhood', 'city', 'state'].map((field) => ({
        [field]: { contains: searchText, mode: 'insensitive' },
      })),
    } : {}),
  };
}

function getNearbyCoordinateBounds(query: SearchPublicPropertyListingsDto) {
  if (query.latitude === undefined || query.longitude === undefined) return undefined;
  const radius = query.radiusKm ?? 25;
  const latitudeOffset = radius / 110.574;
  const longitudeOffset = radius / (111.32 * Math.max(Math.cos(query.latitude * Math.PI / 180), 0.01));
  return {
    latitude: { gte: query.latitude - latitudeOffset, lte: query.latitude + latitudeOffset },
    longitude: { gte: query.longitude - longitudeOffset, lte: query.longitude + longitudeOffset },
  };
}

function calculateDistanceInKilometers(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDifference = toRadians(toLatitude - fromLatitude);
  const longitudeDifference = toRadians(toLongitude - fromLongitude);
  const distanceFormula = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(distanceFormula), Math.sqrt(1 - distanceFormula));
}

export async function findPublicPropertyListings(query: SearchPublicPropertyListingsDto) {
  const where = buildPublicPropertyWhere(query);
  const shouldSearchNearby = query.latitude !== undefined && query.longitude !== undefined;
  const rentAmountRange = {
    ...(query.minimumRentAmount !== undefined ? { gte: query.minimumRentAmount } : {}),
    ...(query.maximumRentAmount !== undefined ? { lte: query.maximumRentAmount } : {}),
  };
  const availableUnitsWhere: Prisma.PropertyUnitWhereInput = {
    isAvailable: true,
    occupancies: { none: { status: { in: [OccupancyStatus.REQUESTED, OccupancyStatus.ACTIVE] } } },
    rentalApplications: { none: { status: RentalApplicationStatus.APPROVED } },
    rentalPeriod: query.rentalPeriod,
    ...(Object.keys(rentAmountRange).length ? { rentAmount: rentAmountRange } : {}),
    ...(query.minimumBedrooms !== undefined ? { bedrooms: { gte: query.minimumBedrooms } } : {}),
  };

  const [properties, totalCount] = await Promise.all([
    prismaDatabaseClient.property.findMany({
      where,
      skip: shouldSearchNearby ? 0 : query.offset,
      take: shouldSearchNearby ? 1000 : query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        streetAddress: true,
        neighborhood: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        university: { select: { id: true, name: true } },
        createdAt: true,
        units: {
          where: availableUnitsWhere,
          orderBy: { rentAmount: 'asc' },
          select: { id: true, name: true, rentAmount: true, rentalPeriod: true, securityDeposit: true, monthlyServiceCharge: true, inspectionFee: true, bedrooms: true, bathrooms: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 12,
          select: { storageKey: true, altText: true },
        },
      },
    }),
    prismaDatabaseClient.property.count({ where }),
  ]);

  if (!shouldSearchNearby || query.latitude === undefined || query.longitude === undefined) return { properties: await addSponsoredPlacement(await addApprovedReviewSummaries(properties)), totalCount };
  const maximumDistance = query.radiusKm ?? 25;
  const nearbyProperties = properties.flatMap((property) => {
    if (property.latitude === null || property.longitude === null) return [];
    const distanceKm = calculateDistanceInKilometers(query.latitude!, query.longitude!, property.latitude, property.longitude);
    return distanceKm <= maximumDistance ? [{ ...property, distanceKm }] : [];
  }).sort((left, right) => left.distanceKm - right.distanceKm);
  return { properties: await addSponsoredPlacement(await addApprovedReviewSummaries(nearbyProperties.slice(query.offset, query.offset + query.pageSize))), totalCount: nearbyProperties.length };
}

async function addApprovedReviewSummaries<T extends { id: string }>(properties: T[]) {
  if (!properties.length) return properties.map((property) => ({ ...property, reviewSummary: { averageRating: null, reviewCount: 0 } }));
  const summaries = await prismaDatabaseClient.propertyReview.groupBy({
    by: ['propertyId'], where: { propertyId: { in: properties.map((property) => property.id) }, status: 'APPROVED' },
    _avg: { rating: true }, _count: { _all: true },
  });
  const byPropertyId = new Map(summaries.map((summary) => [summary.propertyId, { averageRating: summary._avg.rating, reviewCount: summary._count._all }]));
  return properties.map((property) => ({ ...property, reviewSummary: byPropertyId.get(property.id) ?? { averageRating: null, reviewCount: 0 } }));
}

async function addSponsoredPlacement<T extends { id: string; city: string; university: { id: string } | null }>(properties: T[]) {
  const campaigns = await findEligibleSponsoredCampaigns({ properties: properties.map((property) => ({ id: property.id, city: property.city, universityId: property.university?.id ?? null })) });
  const campaign = campaigns[0];
  if (!campaign) return properties.map((property) => ({ ...property, isSponsored: false as const }));
  return properties.map((property) => property.id === campaign.propertyId
    ? { ...property, isSponsored: true as const, sponsoredCampaignId: campaign.id, sponsoredHeadline: campaign.headline, sponsoredDescription: campaign.description }
    : { ...property, isSponsored: false as const }).sort((left, right) => Number(right.isSponsored) - Number(left.isSponsored));
}
