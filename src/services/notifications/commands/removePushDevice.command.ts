import { removeUserPushDevice } from '../../../repositories/pushNotification.repository.js';

export async function removePushDevice(input: { userId: string; expoPushToken: string }) {
  return removeUserPushDevice(input);
}
