import type { PublicPropertyListing } from './propertyListing.model';

export interface PublicPropertyDetail extends Omit<PublicPropertyListing, 'unitHighlights' | 'sponsored'> {
  landlord: { id: string; name: string; memberSince: string; isVerified: boolean };
  units: PublicPropertyListing['unitHighlights'];
  reviews: Array<{ id: string; rating: number; comment: string; createdAt: string }>;
}
