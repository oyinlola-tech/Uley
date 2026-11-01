import { findPublicPropertyListings } from '../../../repositories/property.repository.js';
import type { SearchPublicPropertyListingsDto } from '../../../dtos/propertyListing.dto.js';
import { createSignedImageUrls } from '../../mediaScanning/index.js';

export async function searchPublicPropertyListings(query: SearchPublicPropertyListingsDto) {
  const { properties, totalCount } = await findPublicPropertyListings(query);
  const imageUrls = await createSignedImageUrls(properties.flatMap((property) => property.images.map((image) => image.storageKey)));
  return {
    listings: properties.map((property) => ({
      id: property.id,
      name: property.name,
      description: property.description,
      streetAddress: property.streetAddress,
      neighborhood: property.neighborhood,
      city: property.city,
      state: property.state,
      university: property.university,
      ...('distanceKm' in property ? { distanceKm: property.distanceKm } : {}),
      publishedAt: property.createdAt.toISOString(),
      startingRentAmount: Number(property.units[0]?.rentAmount ?? 0),
      rentalPeriod: property.units[0]?.rentalPeriod ?? query.rentalPeriod,
      availableUnitCount: property.units.length,
      ...(property.isSponsored ? { sponsored: { campaignId: property.sponsoredCampaignId, headline: property.sponsoredHeadline, description: property.sponsoredDescription } } : {}),
      unitHighlights: property.units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        rentAmount: Number(unit.rentAmount),
        rentalPeriod: unit.rentalPeriod,
        securityDeposit: Number(unit.securityDeposit),
        monthlyServiceCharge: Number(unit.monthlyServiceCharge),
        inspectionFee: Number(unit.inspectionFee),
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
      })),
      images: property.images.map((image) => ({ imageUrl: imageUrls[image.storageKey], altText: image.altText })),
    })),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / query.pageSize),
    },
  };
}
