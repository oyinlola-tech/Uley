import { OnboardingScreen } from '@/components/onboardingScreen';
import { AuthFormMode } from '@/enums';

export default function StudentOnboardingPage() {
  return <OnboardingScreen mode={AuthFormMode.STUDENT} />;
}
