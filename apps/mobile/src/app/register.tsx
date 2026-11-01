import { MOBILE_API_ENDPOINTS, MOBILE_AUTH_VALIDATION_LIMITS, MOBILE_UNLISTED_UNIVERSITY_COPY, MOBILE_UNLISTED_UNIVERSITY_VALUE } from '../constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';

import { AccountSetupRole } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { UniversityPicker } from '../components/UniversityPicker';

type RegistrationUniversity = { id: string; name: string; city: string; state: string };

export default function RegistrationPage() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const accountRole = role === AccountSetupRole.LANDLORD || role === AccountSetupRole.CARETAKER ? role : AccountSetupRole.STUDENT;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [universities, setUniversities] = useState<RegistrationUniversity[]>([]);
  const [isUniversitiesLoading, setIsUniversitiesLoading] = useState(true);

  useEffect(() => {
    if (accountRole === AccountSetupRole.CARETAKER) { setIsUniversitiesLoading(false); return; }
    void requestUleyApi<{ universities: RegistrationUniversity[] }>(MOBILE_API_ENDPOINTS.universities)
      .then((result) => setUniversities(result.universities))
      .catch((loadError: unknown) => setErrorMessage(loadError instanceof Error ? loadError.message : MOBILE_ERROR_MESSAGES.requestFailed))
      .finally(() => setIsUniversitiesLoading(false));
  }, [accountRole]);

  async function createAccount(fullName: string, emailAddress: string, password: string, universityId: string, unlistedUniversity?: { name: string; city: string; state: string }) {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const endpoint = accountRole === AccountSetupRole.CARETAKER
        ? MOBILE_API_ENDPOINTS.registerCaretaker
        : accountRole === AccountSetupRole.LANDLORD
        ? MOBILE_API_ENDPOINTS.registerLandlord
        : MOBILE_API_ENDPOINTS.registerStudent;
      await requestUleyApi(endpoint, { fullName, emailAddress, password, ...(accountRole === AccountSetupRole.CARETAKER ? {} : unlistedUniversity ? { unlistedUniversity } : { universityId }) });
      router.replace({ pathname: '/login', params: { registered: 'true' } });
    } catch (registrationError) {
      setErrorMessage(registrationError instanceof Error ? registrationError.message : MOBILE_ERROR_MESSAGES.accountCreationFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow={`${accountRole.toUpperCase()} ACCOUNT SETUP`} title={accountRole === 'student' ? 'A clearer start to finding your place.' : accountRole === AccountSetupRole.CARETAKER ? 'Help residents feel looked after.' : 'List with clarity. Build confidence.'} description={accountRole === 'student' ? 'Create an account to save homes, arrange inspections, and keep your housing conversations together.' : accountRole === AccountSetupRole.CARETAKER ? 'Create a caretaker account. A landlord must assign you to a property before you can see resident issues.' : 'Create an account, then prepare your identity and property details for Uley review before publishing.'} backPath="/role" />
      <RegistrationForm role={accountRole} universities={universities} isUniversitiesLoading={isUniversitiesLoading} isSubmitting={isSubmitting} errorMessage={errorMessage} onSubmit={createAccount} />
    </ScreenFrame>
  );
}

function RegistrationForm({ role, universities, isUniversitiesLoading, isSubmitting, errorMessage, onSubmit }: { role: AccountSetupRole; universities: RegistrationUniversity[]; isUniversitiesLoading: boolean; isSubmitting: boolean; errorMessage: string; onSubmit: (fullName: string, emailAddress: string, password: string, universityId: string, unlistedUniversity?: { name: string; city: string; state: string }) => void }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universityCity, setUniversityCity] = useState('');
  const [universityState, setUniversityState] = useState('');
  const universityIsUnlisted = universityId === MOBILE_UNLISTED_UNIVERSITY_VALUE;
  const unlistedUniversity = universityIsUnlisted ? { name: universityName.trim(), city: universityCity.trim(), state: universityState.trim() } : undefined;
  return (
    <View style={styles.form}>
      <Text style={styles.formHeading}>Your account details</Text>
      <LabeledInput label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" placeholder="e.g. Amara Okafor" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.fullNameMaximumLength} />
      {role !== AccountSetupRole.CARETAKER && <UniversityPicker universities={universities} value={universityId} onChange={setUniversityId} isLoading={isUniversitiesLoading} />}
      {role !== AccountSetupRole.CARETAKER && universityIsUnlisted && <View style={styles.unlistedUniversity}><Text style={styles.unlistedHeading}>{MOBILE_UNLISTED_UNIVERSITY_COPY.heading}</Text><Text style={styles.unlistedDetail}>{MOBILE_UNLISTED_UNIVERSITY_COPY.detail}</Text><LabeledInput label={MOBILE_UNLISTED_UNIVERSITY_COPY.name} value={universityName} onChangeText={setUniversityName} maxLength={180} /><LabeledInput label={MOBILE_UNLISTED_UNIVERSITY_COPY.city} value={universityCity} onChangeText={setUniversityCity} maxLength={120} /><LabeledInput label={MOBILE_UNLISTED_UNIVERSITY_COPY.state} value={universityState} onChangeText={setUniversityState} maxLength={120} /></View>}
      <LabeledInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} autoComplete="email" keyboardType="email-address" placeholder="you@example.com" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.emailMaximumLength} />
      <LabeledInput label="Password" value={password} onChangeText={setPassword} isPassword autoComplete="new-password" placeholder={`At least ${MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters`} maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} helperText={`Use at least ${MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters. A longer passphrase is easier to remember.`} />
      {errorMessage !== '' && <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>}
      <PrimaryButton label={`Create ${role} account`} onPress={() => onSubmit(fullName.trim(), emailAddress.trim(), password, universityId, unlistedUniversity)} loading={isSubmitting} disabled={(role !== AccountSetupRole.CARETAKER && (!universityId || (universityIsUnlisted && (!universityName.trim() || !universityCity.trim() || !universityState.trim())))) || !fullName.trim() || !emailAddress.includes('@') || password.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} />
      <Pressable onPress={() => router.push('/login')} style={styles.linkArea}><Text style={styles.footerText}>Already registered? <Text style={styles.link}>Sign in</Text></Text></Pressable>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginHorizontal: 20, marginTop: 3, marginBottom: 32, padding: 21, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  formHeading: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  unlistedUniversity: { gap: 8, padding: 13, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.softBlue }, unlistedHeading: { color: colors.ink, fontSize: 12, fontWeight: '800' }, unlistedDetail: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  error: { marginTop: 14, color: colors.error, fontSize: 12, lineHeight: 18 },
  linkArea: { alignItems: 'center', paddingVertical: 15 },
  footerText: { color: colors.muted, fontSize: 11 },
  link: { color: colors.primary, fontWeight: '800' },
}); }
