import { AuthFormMode } from '@/enums';
import { OnboardingScreen } from '@/components/onboardingScreen';

export default function BusinessAdvertiserOnboardingPage() {
  return <OnboardingScreen mode={AuthFormMode.BUSINESS} />;
}
