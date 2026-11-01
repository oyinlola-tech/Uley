import { OnboardingScreen } from '@/components/onboardingScreen';
import { AuthFormMode } from '@/enums';

export default function CaretakerOnboardingPage() {
  return <OnboardingScreen mode={AuthFormMode.CARETAKER} />;
}
