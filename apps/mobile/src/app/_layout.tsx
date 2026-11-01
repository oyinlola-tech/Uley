import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../auth/AuthProvider';
import { MobileThemeProvider, useMobileTheme } from '../theme';
import { PushNotificationLinkHandler } from '../components/pushNotificationLinkHandler';

export default function MobileRootLayout() {
  return (
    <MobileThemeProvider>
      <AuthProvider><PushNotificationLinkHandler /><ThemedNavigation /></AuthProvider>
    </MobileThemeProvider>
  );
}

function ThemedNavigation() {
  const { colors, isDark } = useMobileTheme();
  return <><StatusBar style={isDark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade_from_bottom' }}><Stack.Screen name="index" /></Stack></>;
}
