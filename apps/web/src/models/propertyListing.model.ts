export interface PublicPropertyListing {
  id: string;
  name: string;
  description: string;
  streetAddress: string;
  neighborhood: string;
  city: string;
  state: string;
  university?: { id: string; name: string } | null;
  distanceKm?: number;
  publishedAt: string;
  startingRentAmount: number;
  rentalPeriod: string;
  availableUnitCount: number;
  reviewSummary?: { averageRating: number | null; reviewCount: number };
  sponsored?: { campaignId: string; headline: string; description: string };
  unitHighlights: Array<{ id: string; name: string; rentAmount: number; rentalPeriod: string; securityDeposit: number; monthlyServiceCharge: number; inspectionFee: number; bedrooms: number; bathrooms: number }>;
  images: Array<{ imageUrl: string; altText: string }>;
}

export interface PublicPropertyListingResponse {
  listings: PublicPropertyListing[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
}
