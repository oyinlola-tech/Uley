import { NotFoundError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { findPublicPropertyDetail } from '../../../repositories/publicPropertyDetail.repository.js';
import { createSignedImageUrls } from '../../mediaScanning/index.js';

export async function getPublicPropertyDetail(propertyId: string) {
  const property = await findPublicPropertyDetail(propertyId);
  if (!property) throw new NotFoundError(ERROR_MESSAGES.notFound);
  const imageUrls = await createSignedImageUrls(property.images.map((image) => image.storageKey));
  return {
    id: property.id,
    name: property.name,
    description: property.description,
    streetAddress: property.streetAddress,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    university: property.university,
    publishedAt: property.createdAt.toISOString(),
    landlord: {
      id: property.landlord.id,
      name: property.landlord.fullName,
      memberSince: property.landlord.createdAt.toISOString(),
      isVerified: true,
    },
    availableUnitCount: property.units.length,
    reviewSummary: property.reviewSummary,
    units: property.units.map((unit) => ({
      ...unit,
      rentAmount: Number(unit.rentAmount),
      securityDeposit: Number(unit.securityDeposit),
      monthlyServiceCharge: Number(unit.monthlyServiceCharge),
      inspectionFee: Number(unit.inspectionFee),
    })),
    images: property.images.map((image) => ({ imageUrl: imageUrls[image.storageKey], altText: image.altText })),
    reviews: property.reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() })),
  };
}
