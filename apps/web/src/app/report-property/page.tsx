import type { Metadata } from 'next';
import { PropertyReportPage } from '@/components/propertyReportPage';

export const metadata: Metadata = { title: 'Report a Property | Uley', description: 'Send the school a factual report about a property listing.' };

export default function ReportPropertyRoute() {
  return <PropertyReportPage />;
}
