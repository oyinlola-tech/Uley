import type { Metadata } from 'next';
import { AdminSystemLogsWorkspace } from '@/components/adminSystemLogsWorkspace';

export const metadata: Metadata = { title: 'Audit and System Logs | Uley Admin', description: 'Trace administrator actions, property reports, access denials, and API failures.' };

export default function AdminSystemLogsPage() {
  return <AdminSystemLogsWorkspace />;
}
