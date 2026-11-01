import type { ComponentRef, PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { MOBILE_CHROME_MATERIAL } from '../constants';
import { useMobileTheme } from '../theme';
import { useUleyAuth } from '../auth/AuthProvider';
import { MobileAppHeader, MobileBottomNavigation } from './mobileAppChrome';

type ScreenFrameProps = PropsWithChildren<{ scroll?: boolean }>;

export function ScreenFrame({ children, scroll = true }: ScreenFrameProps) {
  const { colors } = useMobileTheme();
  const { account } = useUleyAuth();
  const pathname = usePathname();
  const showBottomNavigation = Boolean(account) || pathname === '/listings';
  const blurTarget = useRef<ComponentRef<typeof View> | null>(null);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios' || typeof AccessibilityInfo.isReduceTransparencyEnabled !== 'function') return;
    let isMounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => { if (isMounted) setReduceTransparency(enabled); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { isMounted = false; subscription.remove(); };
  }, []);
  const screenContent = scroll
    ? <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, styles.headerInset, showBottomNavigation && styles.navigationInset]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[styles.staticContent, styles.headerInset, showBottomNavigation && styles.navigationInset]}>{children}</View>;
  const keyboardContent = <KeyboardAvoidingView style={styles.keyboardFrame} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{screenContent}</KeyboardAvoidingView>;
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={['top', 'bottom']}>
      <View style={styles.frame}>
        <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>{keyboardContent}</BlurTargetView>
        <MobileAppHeader blurTarget={blurTarget} reduceTransparency={reduceTransparency} />
        {showBottomNavigation && <MobileBottomNavigation blurTarget={blurTarget} reduceTransparency={reduceTransparency} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  frame: { flex: 1 },
  keyboardFrame: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  staticContent: { flex: 1 },
  headerInset: { paddingTop: MOBILE_CHROME_MATERIAL.headerContentInset },
  navigationInset: { paddingBottom: MOBILE_CHROME_MATERIAL.navigationContentInset },
});
