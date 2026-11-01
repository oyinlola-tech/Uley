import type { Metadata } from 'next';
import { AdminPropertyWorkspace } from '@/components/adminPropertyWorkspace';

export const metadata: Metadata = { title: 'Listing Oversight | Uley Admin', description: 'Review published homes and manage listing visibility.' };

export default function AdminPropertiesPage() {
  return <AdminPropertyWorkspace />;
}
