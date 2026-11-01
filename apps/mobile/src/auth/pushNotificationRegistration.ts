import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { MOBILE_API_ENDPOINTS, MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY, MOBILE_PUSH_NOTIFICATION_TOKEN_KEY } from '../constants';
import { MOBILE_PUSH_NOTIFICATION_ERRORS } from '../errors';
import { requestUleyApi } from './api';

export async function registerOptedInPushDevice(accessToken: string) {
  if (Platform.OS === 'web') return false;
  const optedIn = await SecureStore.getItemAsync(MOBILE_PUSH_NOTIFICATION_PREFERENCE_KEY);
  if (optedIn !== 'true') return false;
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return false;
  await registerPushDeviceForCurrentAccount(accessToken);
  return true;
}

export async function registerPushDeviceForCurrentAccount(accessToken: string) {
  if (Platform.OS === 'web') return;
  const expoPushToken = await getExpoPushToken();
  await requestUleyApi(MOBILE_API_ENDPOINTS.pushDevices, { expoPushToken, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' }, accessToken);
  await SecureStore.setItemAsync(MOBILE_PUSH_NOTIFICATION_TOKEN_KEY, expoPushToken);
}

export async function removeCurrentPushDeviceRegistration(accessToken: string) {
  if (Platform.OS === 'web') return;
  let expoPushToken = await SecureStore.getItemAsync(MOBILE_PUSH_NOTIFICATION_TOKEN_KEY);
  if (!expoPushToken && (await Notifications.getPermissionsAsync()).status === 'granted') expoPushToken = await getExpoPushToken();
  if (!expoPushToken) return;
  await requestUleyApi(MOBILE_API_ENDPOINTS.pushDevices, { expoPushToken }, accessToken, 'DELETE');
  await SecureStore.deleteItemAsync(MOBILE_PUSH_NOTIFICATION_TOKEN_KEY);
}

export async function getExpoPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error(MOBILE_PUSH_NOTIFICATION_ERRORS.projectNotConfigured);
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}
