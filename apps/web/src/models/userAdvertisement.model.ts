export interface PublicUserAdvertisement {
  id: string;
  category: 'SKILL' | 'JOB' | 'LOCAL_SERVICE';
  title: string;
  description: string;
  city: string;
  ctaLabel: string;
  ctaUrl: string | null;
  presentationStyle: 'FEATURED' | 'COMPACT';
  imageUrl?: string | null;
  advertiser: { id: string; fullName: string; university: { name: string } | null; businessAdvertiserProfile: { businessName: string } | null };
}

export interface PublicUserAdvertisementResponse {
  ads: PublicUserAdvertisement[];
  remainingDailyImpressions: number;
}
