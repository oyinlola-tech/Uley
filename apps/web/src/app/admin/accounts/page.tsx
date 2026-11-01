import type { Metadata } from 'next';
import { AdminAccountWorkspace } from '@/components/adminAccountWorkspace';

export const metadata: Metadata = { title: 'Account Directory | Uley Admin', description: 'Review account access and record account actions.' };

export default function AdminAccountsPage() {
  return <AdminAccountWorkspace />;
}
