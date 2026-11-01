import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUleyAuth } from '../auth/AuthProvider';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { ScreenFrame } from '../components/ScreenFrame';
import { AccountRole } from '../enums';
import { useMobileTheme } from '../theme';

type Ad = { id: string; title: string; status: string; impressionCount: number; clickCount: number; budgetAmount: number | string; paymentConfirmedAt?: string | null };
type Analytics = { impressions: number; clicks: number; clickThroughRate: number; activeAds: number; ads: Ad[] };

export default function AdsAnalyticsPage() {
  const { colors } = useMobileTheme(); const styles = createStyles(colors); const { account, accessToken, isRestoringSession } = useUleyAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    if (isRestoringSession) return;
    if (!accessToken || !account || ![AccountRole.STUDENT, AccountRole.BUSINESS_ADVERTISER].includes(account.userRole)) { router.replace('/login'); return; }
    void requestUleyApi<{ analytics: Analytics }>(MOBILE_API_ENDPOINTS.userAdvertisementAnalytics, undefined, accessToken).then((result) => setAnalytics(result.analytics)).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to load campaign analytics.'));
  }, [account, accessToken, isRestoringSession]);
  return <ScreenFrame><AuthPageHeading eyebrow="CAMPAIGN ANALYTICS" title="See how your ads are doing." description="Track views, clicks, click-through rate, and currently running campaigns." backPath="/ads"/><View style={styles.content}>
    {error ? <Text style={styles.error}>{error}</Text> : !analytics ? <Text style={styles.muted}>Loading campaign results…</Text> : <>
      <View style={styles.metrics}>{[["Impressions", analytics.impressions], ["Clicks", analytics.clicks], ["Click-through rate", `${analytics.clickThroughRate}%`], ["Running", analytics.activeAds]].map(([label, value]) => <View key={String(label)} style={styles.metric}><Text style={styles.muted}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}</View>
      <View style={styles.panel}><Text style={styles.title}>By campaign</Text>{analytics.ads.map((ad) => <View style={styles.row} key={ad.id}><Text style={styles.name}>{ad.title}</Text><Text style={styles.muted}>{ad.status.replaceAll('_',' ')} · {ad.paymentConfirmedAt ? 'paid' : 'payment pending'}</Text><Text style={styles.rowResult}>{ad.impressionCount} views · {ad.clickCount} clicks</Text></View>)}{analytics.ads.length === 0 && <Text style={styles.muted}>Campaign performance will appear after you submit an ad.</Text>}</View>
    </>}
    <Pressable onPress={() => router.push('/ads')}><Text style={styles.link}>Back to Ads Manager →</Text></Pressable>
  </View></ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ content: { gap: 14, paddingHorizontal: 18, paddingBottom: 110 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48%', flexGrow: 1, padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.surface }, muted: { color: colors.muted, fontSize: 11, lineHeight: 16 }, value: { marginTop: 7, color: colors.ink, fontSize: 23, fontWeight: '800' }, panel: { padding: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.surface }, title: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 12 }, row: { paddingVertical: 13, gap: 4, borderTopWidth: 1, borderColor: colors.line }, name: { color: colors.ink, fontSize: 13, fontWeight: '800' }, rowResult: { color: colors.trust, fontSize: 11, fontWeight: '700' }, error: { color: colors.error, fontSize: 12 }, link: { padding: 13, textAlign: 'center', color: colors.primary, fontWeight: '800' } }); }
