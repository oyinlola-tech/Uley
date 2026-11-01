import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS, MOBILE_AUTH_VALIDATION_LIMITS } from '../constants';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';

export default function BusinessAdvertiserRegistrationPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createBusinessAccount() {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.registerBusinessAdvertiser, { fullName: fullName.trim(), businessName: businessName.trim(), category: category.trim(), city: city.trim(), emailAddress: emailAddress.trim(), password, ...(websiteUrl.trim() ? { websiteUrl: websiteUrl.trim() } : {}) });
      router.replace({ pathname: '/login', params: { registered: 'true' } });
    } catch (registrationError) {
      setErrorMessage(registrationError instanceof Error ? registrationError.message : 'We could not create the account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <ScreenFrame><AuthPageHeading eyebrow="BUSINESS ADVERTISER SETUP" title="Bring your work to the campus community." description="Register inside Uley, then create, preview, pay for, and measure your campaigns." backPath="/role" /><View style={styles.form}>
    <LabeledInput label="Your name" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.fullNameMaximumLength} />
    <LabeledInput label="Business name" value={businessName} onChangeText={setBusinessName} maxLength={160} />
    <LabeledInput label="What do you offer?" value={category} onChangeText={setCategory} placeholder="e.g. laundry, food, tutoring" maxLength={80} />
    <LabeledInput label="City" value={city} onChangeText={setCity} maxLength={120} />
    <LabeledInput label="Website (optional)" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" placeholder="https://example.com" maxLength={500} />
    <LabeledInput label="Email address" value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.emailMaximumLength} />
    <LabeledInput label="Password" value={password} onChangeText={setPassword} isPassword autoComplete="new-password" maxLength={MOBILE_AUTH_VALIDATION_LIMITS.passwordMaximumLength} />
    <Text style={styles.note}>Business details and each campaign are reviewed before an ad can appear.</Text>
    {errorMessage !== '' && <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>}
    <PrimaryButton label="Create business account" onPress={createBusinessAccount} loading={isSubmitting} disabled={!fullName.trim() || !businessName.trim() || !category.trim() || !city.trim() || !emailAddress.includes('@') || password.length < MOBILE_AUTH_VALIDATION_LIMITS.passwordMinimumLength} />
  </View></ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginHorizontal: 20, marginTop: 8, marginBottom: 32, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 4 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginVertical: 10 },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, marginVertical: 10 },
}); }
