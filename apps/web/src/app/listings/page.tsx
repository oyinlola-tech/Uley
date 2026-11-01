import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components';
import { PropertyListingPage } from '@/components/propertyListingPage';

export const metadata: Metadata = {
  title: 'Browse Homes | Uley',
  description: 'Search published off-campus homes and compare verified landlord and property details.',
};

export default function ListingsRoute() {
  return <><SiteHeader /><PropertyListingPage /><SiteFooter /></>;
}
