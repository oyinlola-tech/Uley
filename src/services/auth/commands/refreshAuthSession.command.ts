import { rotateAuthSessionAndIssueTokens } from './rotateAuthSession.command.js';

import type { AuthClientType } from '../../../enums/authClientType.enum.js';

export interface RefreshAuthSessionCommand {
  refreshToken: string;
  clientType: AuthClientType;
  userAgent: string | null;
  ipAddress: string | null;
}

export async function refreshAuthenticatedSession(command: RefreshAuthSessionCommand) {
  return rotateAuthSessionAndIssueTokens(command);
}
