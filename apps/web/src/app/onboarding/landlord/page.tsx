import { OnboardingScreen } from '@/components/onboardingScreen';
import { AuthFormMode } from '@/enums';

export default function LandlordOnboardingPage() {
  return <OnboardingScreen mode={AuthFormMode.LANDLORD} />;
}
