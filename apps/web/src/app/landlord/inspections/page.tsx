import type { Metadata } from 'next';
import { LandlordInspectionWorkspace } from '@/components/inspectionWorkspace';

export const metadata: Metadata = {
  title: 'Inspection Requests | Uley',
  description: 'Review and respond to student viewing requests for your properties.',
};

export default function LandlordInspectionsPage() {
  return <LandlordInspectionWorkspace />;
}
