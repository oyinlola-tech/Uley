import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { requestUleyApi } from '../auth/api';
import { registerOptedInPushDevice } from '../auth/pushNotificationRegistration';
import { useUleyAuth } from '../auth/AuthProvider';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });

const NOTIFICATION_DESTINATIONS: Record<string, string> = {
  '/inspections': '/inspections',
  '/landlord/inspections': '/inspections',
  '/messages': '/messages',
  '/complaints': '/complaints',
  '/admin/complaints': '/admin/complaints',
  '/admin/home-reviews': '/admin/reviews',
  '/listings': '/listings',
  '/ads': '/ads',
  '/landlord/ads': '/landlord-ads',
};

export function PushNotificationLinkHandler() {
  const { account, accessToken, isRestoringSession } = useUleyAuth();
  const handledResponseId = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' || !accessToken || isRestoringSession) return;
    void registerOptedInPushDevice(accessToken).catch(() => undefined);
  }, [accessToken, isRestoringSession]);
  useEffect(() => {
    if (Platform.OS === 'web' || !account || !accessToken || isRestoringSession) return;
    const openNotification = (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseId.current === responseId) return;
      handledResponseId.current = responseId;
      const data = response.notification.request.content.data as { href?: unknown; notificationId?: unknown };
      const destination = typeof data.href === 'string' ? NOTIFICATION_DESTINATIONS[data.href] : undefined;
      if (!destination) return;
      if (typeof data.notificationId === 'string') {
        void requestUleyApi(`${MOBILE_API_ENDPOINTS.notifications}${MOBILE_API_ENDPOINTS.notificationReadAction.replace(':notificationId', data.notificationId)}`, {}, accessToken).catch(() => undefined);
      }
      router.push(destination as never);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    const tokenSubscription = Notifications.addPushTokenListener(() => { void registerOptedInPushDevice(accessToken).catch(() => undefined); });
    void Notifications.getLastNotificationResponseAsync().then((response) => { if (response) openNotification(response); });
    return () => { subscription.remove(); tokenSubscription.remove(); };
  }, [account, accessToken, isRestoringSession]);
  return null;
}
