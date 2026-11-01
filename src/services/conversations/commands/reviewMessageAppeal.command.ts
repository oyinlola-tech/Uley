import { decideMessageModerationAppeal } from '../../../repositories/messageModerationAppeal.repository.js';

export async function decideRejectedMessageAppeal(input: Parameters<typeof decideMessageModerationAppeal>[0]) {
  return decideMessageModerationAppeal(input);
}
