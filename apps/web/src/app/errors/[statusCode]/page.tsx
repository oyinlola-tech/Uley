import { notFound } from 'next/navigation';
import { StatusErrorPage } from '@/components/statusErrorPage';
import { getHttpErrorStatusCode } from '@/constants/httpErrorStatus.constant';

export default async function HttpErrorPage({ params }: { params: Promise<{ statusCode: string }> }) {
  const { statusCode } = await params;
  const code = getHttpErrorStatusCode(statusCode);
  if (!code) notFound();
  return <StatusErrorPage code={code} />;
}
