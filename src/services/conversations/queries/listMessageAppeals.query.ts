import { listPendingMessageModerationAppeals } from '../../../repositories/messageModerationAppeal.repository.js';

export async function listMessageAppealsForModerators() {
  return listPendingMessageModerationAppeals();
}
