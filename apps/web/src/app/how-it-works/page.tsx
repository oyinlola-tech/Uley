import type { Metadata } from 'next';
import { HowUleyWorksPage } from '@/components';

export const metadata: Metadata = { title: 'How Uley works | Uley', description: 'See the student journey, current pilot features, what is still being built, and how data moves through Uley.' };

export default function Page() {
  return <HowUleyWorksPage />;
}
