import { MOBILE_API_ENDPOINTS, MOBILE_AUTH_VALIDATION_LIMITS } from '../constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUleyAuth } from '../auth/AuthProvider';
import { requestUleyApi } from '../auth/api';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';
import { MOBILE_ERROR_MESSAGES } from '../errors';


export default function ChangePasswordPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { accessToken, clearNativeSession, isRestoringSession } = useUleyAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isRestoringSession && !accessToken) router.replace('/login');
  }, [accessToken, isRestoringSession]);

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setErrorMessage(MOBILE_ERROR_MESSAGES.passwordsDoNotMatch);
      return;
    }
    if (!accessToken) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.changePassword, { currentPassword, newPassword }, accessToken);
      await clearNativeSession();
      setIsComplete(true);
    } catch (passwordError) {
      setErrorMessage(passwordError instanceof Error ? passwordError.message : MOBILE_ERROR_MESSAGES.passwordChangeFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow="ACCOUNT SECURITY" title={isComplete ? 'Password changed.' : 'Keep your account in your hands.'} description={isComplete ? 'For your protection, all signed-in devices have been signed out.' : 'Use a strong password you have not used before. We’ll sign out your other sessions after the change.'} backPath="/account" />
      <View style={styles.form}>
        {isComplete ? <><Text style={styles.success}>Your password was changed. Sign in again with your new password.</Text><PrimaryButton label="Sign in again" onPress={() => router.replace('/login')} /></> : <>
          <Text style={styles.formHeading}>Change password</Text>
          <LabeledInput label="Current password" value={currentPassword} onChangeText={setCurrentPassword} isPassword autoComplete="current-password" />
          <LabeledInput label="New password" value={newPassword} onChangeText={setNewPassword} isPassword autoComplete="new-password" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} helperText={`Use at least ${MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters.`} />
          <LabeledInput label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword autoComplete="new-password" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} />
          {errorMessage !== '' && <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>}
          <View style={styles.action}><PrimaryButton label="Change password" onPress={() => void changePassword()} loading={isSubmitting} disabled={!currentPassword || newPassword.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength || confirmPassword.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} /></View>
        </>}
      </View>
    </ScreenFrame>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginHorizontal: 20, marginBottom: 32, padding: 21, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  formHeading: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  success: { marginBottom: 18, color: colors.trust, fontSize: 13, lineHeight: 20 },
  error: { marginTop: 13, color: colors.error, fontSize: 12, lineHeight: 18 },
  action: { marginTop: 20 },
}); }
