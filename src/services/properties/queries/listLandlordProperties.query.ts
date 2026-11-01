import { findLandlordProperties } from '../../../repositories/propertyManagement.repository.js';
import { createSignedImageUrls } from '../../mediaScanning/index.js';

export async function listLandlordProperties(landlordId: string) {
  const properties = await findLandlordProperties(landlordId);
  const imageUrls = await createSignedImageUrls(properties.flatMap((property) => property.images.map((image) => image.storageKey)));
  return properties.map((property) => ({ ...property, images: property.images.map((image) => ({ id: image.id, imageUrl: imageUrls[image.storageKey], altText: image.altText })) }));
}
