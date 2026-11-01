import type { Metadata } from 'next';
import { AdminReportWorkspace } from '@/components/adminReportWorkspace';

export const metadata: Metadata = { title: 'Property Reports | Uley Admin', description: 'Review student reports about off-campus properties.' };

export default function AdminReportsPage() {
  return <AdminReportWorkspace />;
}
