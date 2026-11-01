export type Ad = {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  status: string;
  budgetAmount: number | string;
  ctaLabel: string;
  ctaUrl?: string | null;
  presentationStyle: string;
  paymentConfirmedAt?: string | null;
  startsAt: string;
  endsAt: string;
  impressionCount: number;
  clickCount: number;
  decisionNote?: string | null;
  imageUrl?: string | null;
  checkoutReservation?: { reference: string; authorizationUrl: string; expiresAt: string; status: string } | null;
};

export type Analytics = { impressions: number; clicks: number; clickThroughRate: number; activeAds: number };
export type DraftPreview = { title: string; description: string; city: string; ctaLabel: string; style: string; category: string; imageUrl?: string };
