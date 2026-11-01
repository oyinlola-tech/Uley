import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LabeledInput } from '../../components/LabeledInput';
import { AdminShell } from '../../components/adminShell';
import { useAdminResource } from '../../hooks/useAdminResource';
import { MOBILE_API_ENDPOINTS, ADMIN_MOBILE_LOG_LEVELS, MOBILE_ADMIN_LOG_PAGE_SIZE, MOBILE_ADMIN_LOG_COPY } from '../../constants';
import type { AdminSystemLogsData } from '../../models';
import { useMobileTheme } from '../../theme';

export default function AdminSystemLogsPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [page, setPage] = useState(1);
  const parameters = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(MOBILE_ADMIN_LOG_PAGE_SIZE) });
    if (search) query.set('search', search);
    if (level !== 'ALL') query.set('level', level);
    return query.toString();
  }, [level, page, search]);
  const endpoint = `${MOBILE_API_ENDPOINTS.adminSystemLogs}?${parameters}`;
  const { data, error, isLoading, reload } = useAdminResource<AdminSystemLogsData>(endpoint);
  function applySearch() { setPage(1); setSearch(searchInput.trim()); }

  return <AdminShell title={MOBILE_ADMIN_LOG_COPY.title} activeRoute="/admin/logs"><Text style={styles.intro}>{MOBILE_ADMIN_LOG_COPY.intro}</Text><LabeledInput label={MOBILE_ADMIN_LOG_COPY.searchLabel} value={searchInput} onChangeText={setSearchInput} placeholder={MOBILE_ADMIN_LOG_COPY.searchPlaceholder} /><Pressable style={styles.action} onPress={applySearch}><Text style={styles.actionText}>{MOBILE_ADMIN_LOG_COPY.searchButton}</Text></Pressable><View style={styles.filters}>{ADMIN_MOBILE_LOG_LEVELS.map((item) => <Pressable key={item} onPress={() => { setPage(1); setLevel(item); }} style={[styles.filter, level === item && styles.filterActive]}><Text style={[styles.filterText, level === item && styles.filterTextActive]}>{item}</Text></Pressable>)}<Pressable onPress={() => void reload()} style={styles.refresh}><Text style={styles.actionText}>{MOBILE_ADMIN_LOG_COPY.refresh}</Text></Pressable></View>{error !== '' && <Text style={styles.error}>{error}</Text>}{isLoading && <Text style={styles.empty}>{MOBILE_ADMIN_LOG_COPY.loading}</Text>}{!isLoading && data?.logs.length === 0 && <Text style={styles.empty}>{MOBILE_ADMIN_LOG_COPY.noResults}</Text>}{data?.logs.map((log) => <View key={log.id} style={styles.log}><View style={styles.titleRow}><Text style={styles.level}>{log.level}</Text><Text style={styles.event}>{log.eventType.replaceAll('_', ' ')}</Text></View><Text style={styles.summary}>{log.summary}</Text><Text style={styles.detail}>{new Date(log.occurredAt).toLocaleString()}</Text><Text style={styles.detail}>{log.actor ? `${log.actor.fullName} · ${log.actor.role.replaceAll('_', ' ')}` : MOBILE_ADMIN_LOG_COPY.unauthenticated}</Text>{log.route && <Text style={styles.detail}>{log.method} {log.route} · {log.statusCode ?? '—'}</Text>}{log.errorCode && <Text style={styles.detail}>Error: {log.errorCode}</Text>}{log.targetType && <Text style={styles.detail}>Target: {log.targetType} {log.targetId}</Text>}{log.requestId && <Text selectable style={styles.requestId}>Request ID: {log.requestId}</Text>}{Boolean(log.metadata) && <Text style={styles.detail}>Context: {JSON.stringify(log.metadata)}</Text>}</View>)}{data && data.pagination.totalPages > 1 && <View style={styles.pagination}><Pressable disabled={page <= 1} onPress={() => setPage((current) => current - 1)}><Text style={styles.pageAction}>{MOBILE_ADMIN_LOG_COPY.previous}</Text></Pressable><Text style={styles.detail}>{page} / {data.pagination.totalPages}</Text><Pressable disabled={page >= data.pagination.totalPages} onPress={() => setPage((current) => current + 1)}><Text style={styles.pageAction}>{MOBILE_ADMIN_LOG_COPY.next}</Text></Pressable></View>}</AdminShell>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  intro: { marginBottom: 16, color: colors.muted, fontSize: 11, lineHeight: 17 }, action: { minHeight: 42, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.action }, actionText: { color: '#fff', fontSize: 10, fontWeight: '800' }, filters: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 14 }, filter: { paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, borderRadius: 15 }, filterActive: { backgroundColor: colors.action, borderColor: colors.primary }, filterText: { color: colors.muted, fontSize: 9, fontWeight: '700' }, filterTextActive: { color: '#fff' }, refresh: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: colors.trust }, log: { paddingVertical: 13, borderBottomWidth: 1, borderColor: colors.line }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, level: { color: colors.trust, fontSize: 8, fontWeight: '900' }, event: { color: colors.ink, fontSize: 10, fontWeight: '800' }, summary: { marginTop: 7, color: colors.ink, fontSize: 11, lineHeight: 16 }, detail: { marginTop: 4, color: colors.muted, fontSize: 9, lineHeight: 14 }, requestId: { marginTop: 7, color: colors.primary, fontFamily: 'monospace', fontSize: 9 }, empty: { paddingVertical: 20, color: colors.muted, textAlign: 'center', fontSize: 10 }, error: { marginTop: 12, color: colors.error, fontSize: 10 }, pagination: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18 }, pageAction: { color: colors.primary, fontSize: 10, fontWeight: '800' },
}); }
