import { StatusErrorPage } from '@/components/statusErrorPage';

export default function NotFoundPage() {
  return <StatusErrorPage code={404} />;
}
