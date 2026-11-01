'use client';

import { StatusErrorPage } from '@/components/statusErrorPage';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StatusErrorPage code={500} onRetry={reset} />;
}
