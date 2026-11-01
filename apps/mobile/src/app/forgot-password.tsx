import { MOBILE_API_ENDPOINTS, MOBILE_AUTH_VALIDATION_LIMITS, MOBILE_PASSWORD_RECOVERY_TIMING } from '../constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';

import { PasswordRecoveryStage } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';

export default function ForgotPasswordPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [stage, setStage] = useState(PasswordRecoveryStage.EMAIL);
  const [emailAddress, setEmailAddress] = useState('');
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown < 1) return;
    const countdownTimer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(countdownTimer);
  }, [resendCooldown]);

  async function requestRecoveryCode() {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.requestPasswordReset, { emailAddress: emailAddress.trim() });
      setStatusMessage('If an account uses that address, a six-digit recovery code has been sent.');
      setStage(PasswordRecoveryStage.CODE);
      setResendCooldown(MOBILE_PASSWORD_RECOVERY_TIMING.resendCooldownInSeconds);
    } catch (requestError) {
      setErrorMessage(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyRecoveryCode() {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const verified = await requestUleyApi<{ resetToken: string }>(MOBILE_API_ENDPOINTS.verifyPasswordResetCode, {
        emailAddress: emailAddress.trim(), oneTimeCode,
      });
      setResetToken(verified.resetToken);
      setStatusMessage('Code verified. Choose a new password.');
      setStage(PasswordRecoveryStage.PASSWORD);
    } catch (requestError) {
      setErrorMessage(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetAccountPassword() {
    if (newPassword !== confirmPassword) {
      setErrorMessage(MOBILE_ERROR_MESSAGES.passwordsDoNotMatch);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.confirmPasswordReset, { resetToken, newPassword });
      setStage(PasswordRecoveryStage.COMPLETE);
      setStatusMessage('Your password has been reset. Sign in with your new password.');
    } catch (requestError) {
      setErrorMessage(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = stage === PasswordRecoveryStage.EMAIL ? 'A secure way back into Uley.' : stage === PasswordRecoveryStage.CODE ? 'Enter your recovery code.' : stage === PasswordRecoveryStage.PASSWORD ? 'Choose a new password.' : 'Password updated.';
  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow="ACCOUNT SECURITY" title={title} description="We’ll verify the email on your account before allowing a password reset." backPath="/login" />
      <View style={styles.form}>
        <Text style={styles.stepLabel}>{stage === PasswordRecoveryStage.EMAIL ? 'PASSWORD RECOVERY · 01 / 03' : stage === PasswordRecoveryStage.CODE ? 'PASSWORD RECOVERY · 02 / 03' : 'PASSWORD RECOVERY · 03 / 03'}</Text>
        {stage === PasswordRecoveryStage.EMAIL && <>
          <Text style={styles.formHeading}>Where should we send it?</Text>
          <LabeledInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
        </>}
        {stage === PasswordRecoveryStage.CODE && <>
          <Text style={styles.formHeading}>Check your inbox</Text><Text style={styles.hint}>{statusMessage} The code expires in {MOBILE_PASSWORD_RECOVERY_TIMING.codeLifetimeInMinutes} minutes.</Text>
          <LabeledInput label="Six-digit code" value={oneTimeCode} onChangeText={(value) => setOneTimeCode(value.replace(/\D/g, '').slice(0, MOBILE_AUTH_VALIDATION_LIMITS.passwordResetCodeLength))} keyboardType="number-pad" autoComplete="one-time-code" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordResetCodeLength} placeholder="000000" />
          <Pressable disabled={resendCooldown > 0 || isSubmitting} onPress={() => void requestRecoveryCode()} style={styles.resend}><Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>{resendCooldown > 0 ? `Send another code in ${resendCooldown}s` : 'Send another code'}</Text></Pressable>
        </>}
        {stage === PasswordRecoveryStage.PASSWORD && <><Text style={styles.formHeading}>Set a new password</Text><LabeledInput label="New password" value={newPassword} onChangeText={setNewPassword} isPassword autoComplete="new-password" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} helperText={`Use at least ${MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters.`} /><LabeledInput label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword autoComplete="new-password" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} /></>}
        {stage === PasswordRecoveryStage.COMPLETE && <View style={styles.complete}><Text style={styles.completeMark}>✓</Text><Text style={styles.completeText}>{statusMessage}</Text><PrimaryButton label="Go to sign in" onPress={() => router.replace('/login')} /></View>}
        {errorMessage !== '' && <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>}
        {stage !== PasswordRecoveryStage.COMPLETE && <PrimaryButton label={stage === PasswordRecoveryStage.EMAIL ? 'Send recovery code' : stage === PasswordRecoveryStage.CODE ? 'Verify code' : 'Reset password'} onPress={() => void (stage === PasswordRecoveryStage.EMAIL ? requestRecoveryCode() : stage === PasswordRecoveryStage.CODE ? verifyRecoveryCode() : resetAccountPassword())} loading={isSubmitting} disabled={stage === PasswordRecoveryStage.EMAIL ? !emailAddress.includes('@') : stage === PasswordRecoveryStage.CODE ? oneTimeCode.length !== MOBILE_AUTH_VALIDATION_LIMITS.passwordResetCodeLength : newPassword.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength || confirmPassword.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} />}
        {stage !== PasswordRecoveryStage.COMPLETE && <Pressable style={styles.footer} onPress={() => router.replace('/login')}><Text style={styles.footerText}>Remembered it? <Text style={styles.link}>Sign in</Text></Text></Pressable>}
      </View>
    </ScreenFrame>
  );
}

function getErrorMessage(requestError: unknown): string {
  return requestError instanceof Error ? requestError.message : MOBILE_ERROR_MESSAGES.requestFailed;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginHorizontal: 20, marginBottom: 32, padding: 21, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  stepLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  formHeading: { marginTop: 17, color: colors.ink, fontSize: 18, fontWeight: '800' },
  hint: { marginTop: 10, color: colors.muted, fontSize: 12, lineHeight: 18 },
  resend: { alignSelf: 'flex-end', paddingVertical: 14 },
  resendText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  resendDisabled: { color: colors.muted },
  error: { marginVertical: 13, color: colors.error, fontSize: 12, lineHeight: 18 },
  complete: { alignItems: 'center', gap: 14, paddingVertical: 17 },
  completeMark: { width: 42, height: 42, overflow: 'hidden', borderRadius: 21, backgroundColor: colors.successSurface, color: colors.trust, fontSize: 25, textAlign: 'center', lineHeight: 42 },
  completeText: { color: colors.ink, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  footer: { alignItems: 'center', paddingVertical: 15 },
  footerText: { color: colors.muted, fontSize: 11 },
  link: { color: colors.primary, fontWeight: '800' },
}); }
