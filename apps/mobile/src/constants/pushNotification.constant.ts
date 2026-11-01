export const MOBILE_PUSH_NOTIFICATION_COPY = {
  sectionTitle: 'Phone notifications',
  sectionDescription: 'Get inspection reminders and account updates when Uley is closed. Private chat and support details stay inside the app.',
  enableButton: 'Enable push notifications',
  disableButton: 'Turn off notifications on this device',
  enabledMessage: 'Push notifications are enabled on this device.',
  disabledMessage: 'Push notifications are off on this device.',
  deniedMessage: 'Notifications are disabled in your phone settings. Turn them on there, then try again.',
  unavailableMessage: 'Push notifications are available in the Uley mobile app. In-app alerts still work here.',
} as const;

export const MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY = 'uley.push-notifications.enabled';
export const MOBILE_PUSH_NOTIFICATION_TOKEN_KEY = 'uley.push-notifications.expo-token';
export const MOBILE_PUSH_NOTIFICATION_CHANNEL = 'Uley updates';
