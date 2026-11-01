import type { Metadata } from 'next';
import { AdminDashboardWorkspace } from '@/components/adminDashboardWorkspace';

export const metadata: Metadata = { title: 'School Admin Dashboard | Uley', description: 'Review school verification work, property reports, account status, and platform activity.' };

export default function AdminDashboardPage() {
  return <AdminDashboardWorkspace />;
}
