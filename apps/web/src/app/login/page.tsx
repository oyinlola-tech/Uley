import { OnboardingScreen } from '@/components/onboardingScreen';
import { AuthFormMode } from '@/enums';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const requestedNextPath = (await searchParams).next;
  const nextPath = requestedNextPath?.startsWith('/inspections') || requestedNextPath?.startsWith('/report-property') ? requestedNextPath : undefined;
  return <OnboardingScreen mode={AuthFormMode.LOGIN} nextPath={nextPath} />;
}
