import type { Metadata } from 'next';
import { VerificationGuidePage } from '@/components';

export const metadata: Metadata = {
  title: 'What Uley Checks | Uley',
  description: 'See how landlord and property reviews work before an off-campus home is published on Uley.',
};

export default function VerificationGuideRoute() {
  return <VerificationGuidePage />;
}
