import { registerUserPushDevice } from '../../../repositories/pushNotification.repository.js';

export async function registerPushDevice(input: { userId: string; expoPushToken: string; platform: 'IOS' | 'ANDROID' }) {
  return registerUserPushDevice(input);
}
