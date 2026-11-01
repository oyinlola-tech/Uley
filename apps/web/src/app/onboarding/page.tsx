import { OnboardingScreen } from '@/components/onboardingScreen';
import { AuthFormMode } from '@/enums';

export default function OnboardingPage() {
  return <OnboardingScreen mode={AuthFormMode.CHOOSE} />;
}
