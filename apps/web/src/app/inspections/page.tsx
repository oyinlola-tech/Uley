import type { Metadata } from 'next';
import { StudentInspectionWorkspace } from '@/components/inspectionWorkspace';

export const metadata: Metadata = {
  title: 'Plan an Inspection | Uley',
  description: 'Request a property viewing and keep your inspection details in one place.',
};

export default function InspectionsPage() {
  return <StudentInspectionWorkspace />;
}
