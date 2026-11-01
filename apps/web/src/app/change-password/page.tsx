import { PasswordSecurityScreen } from '@/components/passwordSecurityScreen';
import { PasswordSecurityMode } from '@/enums';

export default function ChangePasswordPage() {
  return <PasswordSecurityScreen mode={PasswordSecurityMode.CHANGE_PASSWORD} />;
}
