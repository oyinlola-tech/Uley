import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { MOBILE_API_ENDPOINTS, MOBILE_PROPERTY_REPORT_LABELS } from '../constants';
import { PropertyReportCategory } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';

export default function ReportPropertyScreen() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { account, accessToken, isRestoringSession } = useUleyAuth();
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const [category, setCategory] = useState(PropertyReportCategory.UNSAFE);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isRestoringSession || account) return;
    router.replace({ pathname: '/login', params: { next: `/report-property?propertyId=${encodeURIComponent(String(propertyId ?? ''))}` } });
  }, [account, isRestoringSession, propertyId]);
  async function sendReport() {
    if (!accessToken || !propertyId) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.propertyReports, { propertyId, category, description: description.trim() }, accessToken);
      setNotice(MOBILE_ERROR_MESSAGES.propertyReportSent); setDescription('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setBusy(false); }
  }
  return <ScreenFrame><AuthPageHeading eyebrow="PROPERTY SAFETY REPORT" title="Help the school review a listing." description="Share a clear, factual description of what needs attention. The school will review the report." backPath="/listings" /><View style={styles.panel}><Text style={styles.heading}>Choose the closest issue</Text><View style={styles.categories}>{Object.values(PropertyReportCategory).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.selectedCategory]}><Text style={[styles.categoryText, category === item && styles.selectedCategoryText]}>{MOBILE_PROPERTY_REPORT_LABELS[item]}</Text></Pressable>)}</View><LabeledInput label="What happened?" placeholder="Explain what you saw, where, and when." value={description} onChangeText={setDescription} multiline numberOfLines={5} /><Text style={styles.hint}>Keep the report specific and factual (20 characters minimum).</Text>{!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}<PrimaryButton label="Send report to the school" onPress={() => void sendReport()} disabled={busy || description.trim().length < 20 || !propertyId} loading={busy} /></View></ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  panel: { marginHorizontal: 20, marginBottom: 28, padding: 20, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.surface },
  heading: { marginBottom: 12, color: colors.ink, fontSize: 15, fontWeight: '800' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  category: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 20 },
  selectedCategory: { borderColor: colors.trust, backgroundColor: colors.paleGreen },
  categoryText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  selectedCategoryText: { color: colors.trust },
  hint: { marginTop: 6, marginBottom: 14, color: colors.muted, fontSize: 10, lineHeight: 15 },
  error: { marginBottom: 12, color: colors.error, fontSize: 12 },
  notice: { marginBottom: 12, color: colors.trust, fontSize: 12, lineHeight: 18 },
}); }
