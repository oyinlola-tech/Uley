import type { Metadata } from 'next';
import { RentalApplicationWorkspace } from '@/components/rentalApplicationWorkspace';

export const metadata: Metadata = { title: 'My Applications | Uley', description: 'Track your applications for student accommodation.' };

export default function ApplicationsPage() {
  return <RentalApplicationWorkspace role="STUDENT" />;
}
