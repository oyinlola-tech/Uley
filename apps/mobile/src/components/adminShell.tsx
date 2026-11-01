import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { ADMIN_MOBILE_NAVIGATION } from '../constants';
import { AccountRole } from '../enums';
import { useMobileTheme } from '../theme';
import { useUleyAuth } from '../auth/AuthProvider';
import { ScreenFrame } from './ScreenFrame';

export function AdminShell({ activeRoute, title, children }: { activeRoute: string; title: string; children: ReactNode }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { account } = useUleyAuth();
  const role = account?.userRole;
  const links = ADMIN_MOBILE_NAVIGATION.filter((link) => role && (link.roles as readonly AccountRole[]).includes(role));
  return <ScreenFrame><View style={styles.page}><Text style={styles.eyebrow}>{account?.userRole?.replaceAll('_', ' ')}</Text><Text style={styles.title}>{title}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigation}>{links.map((link) => <Pressable key={link.route} onPress={() => router.replace(link.route as Href)} style={[styles.navItem, activeRoute === link.route && styles.navItemActive]}><Text style={[styles.navText, activeRoute === link.route && styles.navTextActive]}>{link.label}</Text></Pressable>)}</ScrollView>{children}</View></ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 28 },
  eyebrow: { marginTop: 22, color: colors.trust, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 5, marginBottom: 15, color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -1.2 },
  navigation: { gap: 7, paddingBottom: 14 },
  navItem: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  navItemActive: { backgroundColor: colors.action, borderColor: colors.action },
  navText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  navTextActive: { color: '#FFFFFF' },
}); }
