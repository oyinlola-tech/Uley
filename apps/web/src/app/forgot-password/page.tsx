import { PasswordSecurityScreen } from '@/components/passwordSecurityScreen';
import { PasswordSecurityMode } from '@/enums';

export default function ForgotPasswordPage() {
  return <PasswordSecurityScreen mode={PasswordSecurityMode.FORGOT_PASSWORD} />;
}
