import { MOBILE_API_ENDPOINTS } from '../constants';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUleyAuth } from '../auth/AuthProvider';
import { requestUleyApi } from '../auth/api';

import { AccountRole, AuthClientType, isAdministratorAccountRole } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import type { NativeAuthResponse } from '../auth/api';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';

export default function LoginPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { registered, next } = useLocalSearchParams<{ registered?: string; next?: string }>();
  const { saveSession } = useUleyAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const session = await requestUleyApi<NativeAuthResponse>(MOBILE_API_ENDPOINTS.signIn, { emailAddress: emailAddress.trim(), password, clientType: AuthClientType.NATIVE });
      await saveSession(session);
      const allowedContinuation = next?.startsWith('/inspections') || next?.startsWith('/report-property') ? next : undefined;
      const destination = isAdministratorAccountRole(session.authenticatedUser.userRole)
        ? '/admin'
        : allowedContinuation ?? (session.authenticatedUser.userRole === AccountRole.LANDLORD ? '/landlord' : session.authenticatedUser.userRole === AccountRole.CARETAKER ? '/caretaker-complaints' : session.authenticatedUser.userRole === AccountRole.BUSINESS_ADVERTISER ? '/ads' : '/account');
      router.replace(destination as Href);
    } catch (loginError) {
      setErrorMessage(loginError instanceof Error ? loginError.message : MOBILE_ERROR_MESSAGES.signInFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow="WELCOME BACK" title="Pick up where you left off." description="Sign in to continue with your Uley account and housing journey." backPath="/" />
      <View style={styles.form}>
        {registered === 'true' && <Text style={styles.success}>Your account is ready. Sign in to continue.</Text>}
        <Text style={styles.formHeading}>Sign in to Uley</Text>
        <LabeledInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
        <LabeledInput label="Password" value={password} onChangeText={setPassword} isPassword autoComplete="current-password" placeholder="Enter your password" />
        <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgot}><Text style={styles.link}>Forgot password?</Text></Pressable>
        {errorMessage !== '' && <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>}
        <PrimaryButton label="Sign in" onPress={() => void signIn()} loading={isSubmitting} disabled={!emailAddress.includes('@') || password.length < 1} />
        <Pressable onPress={() => router.push('/role')} style={styles.footer}><Text style={styles.footerText}>New to Uley? <Text style={styles.link}>Create an account</Text></Text></Pressable>
      </View>
    </ScreenFrame>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginHorizontal: 20, marginBottom: 32, padding: 21, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  success: { marginBottom: 16, padding: 12, borderRadius: 10, backgroundColor: colors.successSurface, color: colors.trust, fontSize: 11, lineHeight: 17 },
  formHeading: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  forgot: { alignSelf: 'flex-end', paddingVertical: 14 },
  link: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  error: { marginVertical: 12, color: colors.error, fontSize: 12, lineHeight: 18 },
  footer: { alignItems: 'center', paddingVertical: 15 },
  footerText: { color: colors.muted, fontSize: 11 },
}); }
