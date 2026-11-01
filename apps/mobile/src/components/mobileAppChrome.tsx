import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { BuildingsIcon, CalendarCheckIcon, ChatCircleDotsIcon, HouseLineIcon, UserCircleIcon } from 'phosphor-react-native';
import type { ComponentRef, RefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MOBILE_CHROME_MATERIAL } from '../constants';
import { AccountRole, isAdministratorAccountRole } from '../enums';
import { useUleyAuth } from '../auth/AuthProvider';
import { useMobileTheme } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { UleyWordmark } from './UleyWordmark';

type MobileChromeProps = { blurTarget: RefObject<ComponentRef<typeof View> | null>; reduceTransparency: boolean };

export function MobileAppHeader({ blurTarget, reduceTransparency }: MobileChromeProps) {
  const { account } = useUleyAuth();
  const { colors, isDark } = useMobileTheme();
  const role = account?.userRole?.replaceAll('_', ' ').toLowerCase() ?? 'OFF-CAMPUS HOMES';
  return <View style={[styles.header, { borderBottomColor: colors.line, backgroundColor: reduceTransparency ? colors.paper : 'transparent' }]}>
    {!reduceTransparency && <BlurView pointerEvents="none" blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" intensity={MOBILE_CHROME_MATERIAL.blurIntensity} tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />}
    <View style={styles.headerContent}><View style={styles.brand}><UleyWordmark /><Text style={[styles.role, { color: colors.muted }]}>{role}</Text></View>
    <ThemeToggle appearance="chrome" /></View>
  </View>;
}

export function MobileBottomNavigation({ blurTarget, reduceTransparency }: MobileChromeProps) {
  const { account } = useUleyAuth();
  const { colors, isDark } = useMobileTheme();
  const pathname = usePathname();
  const admin = account ? isAdministratorAccountRole(account.userRole) : false;
  const landlord = account?.userRole === AccountRole.LANDLORD;
  const caretaker = account?.userRole === AccountRole.CARETAKER;
  const businessAdvertiser = account?.userRole === AccountRole.BUSINESS_ADVERTISER;
  const links = !account
    ? [{ label: 'Explore', route: '/listings', icon: HouseLineIcon }, { label: 'Sign in', route: '/login', icon: UserCircleIcon }, { label: 'Join Uley', route: '/role', icon: BuildingsIcon }]
    : admin
    ? [{ label: 'Admin', route: '/admin', icon: BuildingsIcon }, { label: 'Visits', route: '/admin/inspections', icon: CalendarCheckIcon }, { label: 'Account', route: '/account', icon: UserCircleIcon }]
    : caretaker
      ? [{ label: 'Issues', route: '/caretaker-complaints', icon: BuildingsIcon }, { label: 'Messages', route: '/messages', icon: ChatCircleDotsIcon }, { label: 'Account', route: '/account', icon: UserCircleIcon }]
    : businessAdvertiser
      ? [{ label: 'Ads', route: '/ads', icon: BuildingsIcon }, { label: 'Results', route: '/ads/analytics', icon: CalendarCheckIcon }, { label: 'Messages', route: '/messages', icon: ChatCircleDotsIcon }, { label: 'Account', route: '/account', icon: UserCircleIcon }]
    : landlord
      ? [{ label: 'Properties', route: '/landlord', icon: HouseLineIcon }, { label: 'Ads', route: '/landlord-ads', icon: BuildingsIcon }, { label: 'Visits', route: '/inspections', icon: CalendarCheckIcon }, { label: 'Issues', route: '/landlord-complaints', icon: BuildingsIcon }, { label: 'Account', route: '/account', icon: UserCircleIcon }]
      : [{ label: 'Explore', route: '/listings', icon: HouseLineIcon }, { label: 'Ads', route: '/ads', icon: BuildingsIcon }, { label: 'Visits', route: '/inspections', icon: CalendarCheckIcon }, { label: 'Flatmates', route: '/flatmates', icon: BuildingsIcon }, { label: 'Messages', route: '/messages', icon: ChatCircleDotsIcon }, { label: 'Account', route: '/account', icon: UserCircleIcon }];
  return <View style={[styles.navigation, { backgroundColor: reduceTransparency ? colors.surface : 'transparent', borderColor: colors.line }]}>
    {!reduceTransparency && <BlurView pointerEvents="none" blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" intensity={MOBILE_CHROME_MATERIAL.blurIntensity} tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />}
    {links.map(({ label, route, icon: Icon }) => {
      const active = pathname === route || (route !== '/account' && pathname.startsWith(route + '/'));
      return <Pressable key={route} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={() => router.replace(route as never)} style={[styles.navButton, active && { backgroundColor: colors.softBlue }]}>
        <Icon size={21} weight={active ? 'fill' : 'regular'} color={active ? colors.action : colors.muted} />
        <Text style={[styles.navLabel, { color: active ? colors.action : colors.muted }]}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: MOBILE_CHROME_MATERIAL.headerHeight, zIndex: 5, borderBottomWidth: 1, overflow: 'hidden' },
  headerContent: { flex: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  role: { maxWidth: 125, fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  navigation: { position: 'absolute', right: 12, bottom: MOBILE_CHROME_MATERIAL.navigationBottomInset, left: 12, zIndex: 5, minHeight: MOBILE_CHROME_MATERIAL.navigationHeight, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderRadius: 24, overflow: 'hidden', paddingHorizontal: 5, paddingVertical: 4 },
  navButton: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 18 },
  navLabel: { fontSize: 9, fontWeight: '700' },
});
