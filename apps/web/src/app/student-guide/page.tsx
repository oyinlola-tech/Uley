import type { Metadata } from 'next';
import { StudentGuidePage } from '@/components';

export const metadata: Metadata = {
  title: 'The Student Guide | Uley',
  description: 'A practical guide to comparing off-campus homes, planning an inspection, and checking the terms before you decide.',
};

export default function StudentGuideRoute() {
  return <StudentGuidePage />;
}
