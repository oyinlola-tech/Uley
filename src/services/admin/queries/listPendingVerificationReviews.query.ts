import { findPendingVerificationReviews } from '../../../repositories/propertyManagement.repository.js';
import { createSignedImageUrls } from '../../mediaScanning/index.js';

export async function listPendingVerificationReviews() {
  const reviews = await findPendingVerificationReviews();
  const propertyImages = reviews.propertyVerifications.flatMap((review) => review.property.images);
  const imageUrls = await createSignedImageUrls(propertyImages.map((image) => image.storageKey));
  return {
    ...reviews,
    propertyVerifications: reviews.propertyVerifications.map((review) => ({
      ...review, property: { ...review.property, images: review.property.images.map((image) => ({ id: image.id, imageUrl: imageUrls[image.storageKey], altText: image.altText })) },
    })),
  };
}
