import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components';
import { PropertyDetailPage } from '@/components/propertyDetailPage';

export const metadata: Metadata = {
  title: 'Verified Home Details | Uley',
  description: 'Review verified property information, available units, clear costs and student feedback.',
};

export default async function PropertyDetailRoute({ params }: PageProps<'/listings/[propertyId]'>) {
  const { propertyId } = await params;
  return <><SiteHeader /><PropertyDetailPage propertyId={propertyId} /><SiteFooter /></>;
}
