import type { Metadata } from 'next';
import { LandlordGuidePage } from '@/components';

export const metadata: Metadata = {
  title: 'For Landlords | Uley',
  description: 'Learn how landlords request school verification and submit clear off-campus property listings on Uley.',
};

export default function LandlordGuideRoute() {
  return <LandlordGuidePage />;
}
