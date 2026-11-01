import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightIcon } from 'phosphor-react-native';
import { MOBILE_API_ENDPOINTS, ADMIN_MOBILE_METRIC_LABELS } from '../../constants';
import type { AdminDashboardData } from '../../models';
import { useAdminResource } from '../../hooks/useAdminResource';
import { useMobileTheme } from '../../theme';
import { AdminShell } from '../../components/adminShell';

export default function AdminHomePage() {
  const { data, error, isLoading } = useAdminResource<AdminDashboardData>(MOBILE_API_ENDPOINTS.adminDashboard);
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  return <AdminShell title="Admin overview" activeRoute="/admin"><Text style={styles.intro}>Welcome, {data?.administrator ?? 'administrator'}. Here is the latest activity across Uley.</Text>{error !== '' && <Text style={styles.error}>{error}</Text>}{isLoading ? <Text style={styles.empty}>Loading dashboard…</Text> : <View style={styles.metrics}>{Object.entries(ADMIN_MOBILE_METRIC_LABELS).map(([key, label]) => <View key={key} style={styles.metric}><Text style={styles.metricValue}>{data?.metrics[key] ?? 0}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View>}<Text style={styles.sectionTitle}>Recent admin actions</Text>{(data?.recentActions ?? []).map((action) => <View key={action.id} style={styles.activity}><Text style={styles.actionTitle}>{action.actionType.replaceAll('_', ' ')}</Text><Text style={styles.activityDetail}>{action.reason}</Text><Text style={styles.activityMeta}>{action.actor.fullName} · {new Date(action.createdAt).toLocaleString()}</Text></View>)}<Pressable style={styles.webLink} onPress={() => router.push('/account')}><Text style={styles.linkText}>Account and security</Text><ArrowRightIcon size={16} color={colors.primary} /></Pressable></AdminShell>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  intro: { marginBottom: 18, color: colors.muted, fontSize: 12, lineHeight: 19 }, error: { padding: 12, color: colors.error, backgroundColor: colors.errorSurface, borderRadius: 10, fontSize: 11 },
  empty: { paddingVertical: 22, color: colors.muted, textAlign: 'center', fontSize: 11 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, metric: { width: '48%', minHeight: 92, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }, metricValue: { color: colors.primary, fontSize: 26, fontWeight: '900' }, metricLabel: { marginTop: 6, color: colors.muted, fontSize: 10, lineHeight: 14, fontWeight: '600' },
  sectionTitle: { marginTop: 25, marginBottom: 10, color: colors.ink, fontSize: 16, fontWeight: '800' }, activity: { paddingVertical: 12, borderTopWidth: 1, borderColor: colors.line }, actionTitle: { color: colors.ink, fontSize: 10, fontWeight: '800' }, activityDetail: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 16 }, activityMeta: { marginTop: 4, color: colors.trust, fontSize: 9 }, webLink: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: colors.softBlue }, linkText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
}); }
