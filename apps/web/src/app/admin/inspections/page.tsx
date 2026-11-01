import type { Metadata } from 'next';
import { AdminInspectionWorkspace } from '@/components/adminInspectionWorkspace';

export const metadata: Metadata = { title: 'Inspection Activity | Uley Admin', description: 'Review student inspection activity across verified listings.' };

export default function AdminInspectionsPage() {
  return <AdminInspectionWorkspace />;
}
