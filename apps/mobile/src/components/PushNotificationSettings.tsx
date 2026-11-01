import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { MOBILE_PUSH_NOTIFICATION_CHANNEL, MOBILE_PUSH_NOTIFICATION_COPY, MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY } from '../constants';
import { MOBILE_PUSH_NOTIFICATION_ERRORS } from '../errors';
import { useMobileTheme } from '../theme';
import { registerPushDeviceForCurrentAccount, removeCurrentPushDeviceRegistration } from '../auth/pushNotificationRegistration';

export function PushNotificationSettings({ accessToken }: { accessToken: string }) {
  const { colors } = useMobileTheme();
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    async function restorePushRegistration() {
      try {
        const optedIn = await SecureStore.getItemAsync(MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY);
        const permission = await Notifications.getPermissionsAsync();
        if (active) setEnabled(optedIn === 'true' && permission.status === 'granted');
      } catch { if (active) setNotice(MOBILE_PUSH_NOTIFICATION_ERRORS.registrationFailed); }
    }
    void restorePushRegistration();
    return () => { active = false; };
  }, [accessToken]);

  async function enablePushNotifications() {
    if (Platform.OS === 'web') { setNotice(MOBILE_PUSH_NOTIFICATION_COPY.unavailableMessage); return; }
    setIsBusy(true); setNotice('');
    try {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: MOBILE_PUSH_NOTIFICATION_CHANNEL, importance: Notifications.AndroidImportance.DEFAULT });
      const currentPermission = await Notifications.getPermissionsAsync();
      const permission = currentPermission.status === 'granted' ? currentPermission : await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') { setNotice(MOBILE_PUSH_NOTIFICATION_COPY.deniedMessage); return; }
      await registerPushDeviceForCurrentAccount(accessToken);
      await SecureStore.setItemAsync(MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY, 'true');
      setEnabled(true); setNotice(MOBILE_PUSH_NOTIFICATION_COPY.enabledMessage);
    } catch (failure) { setNotice(failure instanceof Error && failure.message === MOBILE_PUSH_NOTIFICATION_ERRORS.projectNotConfigured ? MOBILE_PUSH_NOTIFICATION_ERRORS.projectNotConfigured : MOBILE_PUSH_NOTIFICATION_ERRORS.registrationFailed); }
    finally { setIsBusy(false); }
  }

  async function disablePushNotifications() {
    if (Platform.OS === 'web') return;
    setIsBusy(true); setNotice('');
    try {
      await removeCurrentPushDeviceRegistration(accessToken);
      await SecureStore.setItemAsync(MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY, 'false');
      setEnabled(false); setNotice(MOBILE_PUSH_NOTIFICATION_COPY.disabledMessage);
    } catch { setNotice(MOBILE_PUSH_NOTIFICATION_ERRORS.removalFailed); }
    finally { setIsBusy(false); }
  }

  return <View style={{ marginTop: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, gap: 8 }}>
    <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>{MOBILE_PUSH_NOTIFICATION_COPY.sectionTitle}</Text>
    <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 16 }}>{MOBILE_PUSH_NOTIFICATION_COPY.sectionDescription}</Text>
    {Platform.OS === 'web' ? <Text style={{ color: colors.muted, fontSize: 10 }}>{MOBILE_PUSH_NOTIFICATION_COPY.unavailableMessage}</Text> : <Pressable disabled={isBusy} onPress={() => void (enabled ? disablePushNotifications() : enablePushNotifications())} style={{ minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 9, backgroundColor: colors.action, opacity: isBusy ? 0.6 : 1 }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{enabled ? MOBILE_PUSH_NOTIFICATION_COPY.disableButton : MOBILE_PUSH_NOTIFICATION_COPY.enableButton}</Text>
    </Pressable>}
    {!!notice && <Text accessibilityRole="alert" style={{ color: colors.muted, fontSize: 10, lineHeight: 15 }}>{notice}</Text>}
  </View>;
}
