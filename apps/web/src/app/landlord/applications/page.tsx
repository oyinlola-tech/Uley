import type { Metadata } from 'next';
import { RentalApplicationWorkspace } from '@/components/rentalApplicationWorkspace';

export const metadata: Metadata = { title: 'Rental Applications | Uley', description: 'Review student applications for your rental properties.' };

export default function LandlordApplicationsPage() {
  return <RentalApplicationWorkspace role="LANDLORD" />;
}
