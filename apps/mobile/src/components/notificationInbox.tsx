import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { useMobileTheme } from '../theme';

type Notification = { id: string; title: string; message: string; readAt?: string | null; scheduledFor: string };
export function NotificationInbox({ accessToken }: { accessToken: string }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const refresh = useCallback(async () => {
    try { const result = await requestUleyApi<{ notifications: Notification[]; unreadCount: number }>(MOBILE_API_ENDPOINTS.notifications, undefined, accessToken); setNotifications(result.notifications); setUnreadCount(result.unreadCount); }
    catch { /* Keep the inspection workspace usable if notification refresh is temporarily unavailable. */ }
  }, [accessToken]);
  useEffect(() => { void refresh(); const interval = setInterval(() => void refresh(), 30000); return () => clearInterval(interval); }, [refresh]);
  async function markRead(notificationId: string) { await requestUleyApi(`${MOBILE_API_ENDPOINTS.notifications}/${notificationId}/read`, {}, accessToken); await refresh(); }
  return <View style={styles.panel}><Text style={styles.title}>Updates · {unreadCount} unread</Text>{notifications.length ? notifications.slice(0, 5).map((item) => <View key={item.id} style={styles.row}><View style={styles.content}><Text style={styles.heading}>{item.title}</Text><Text style={styles.copy}>{item.message}</Text><Text style={styles.copy}>{new Date(item.scheduledFor).toLocaleString()}</Text></View>{!item.readAt && <Pressable onPress={() => void markRead(item.id)}><Text style={styles.action}>Mark read</Text></Pressable>}</View>) : <Text style={styles.copy}>Visit reminders and updates will appear here.</Text>}</View>;
}
function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ panel: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.surface }, title: { marginBottom: 10, color: colors.ink, fontSize: 14, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderColor: colors.line }, content: { flex: 1, gap: 4 }, heading: { color: colors.ink, fontSize: 11, fontWeight: '700' }, copy: { color: colors.muted, fontSize: 10, lineHeight: 15 }, action: { color: colors.primary, fontSize: 10, fontWeight: '800' } }); }
