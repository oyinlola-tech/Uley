import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { mapDatabaseUserToAuthenticatedUserResponse } from '../commands/authResponse.dto.js';
import type { AuthenticatedUserResponse } from '../commands/authResponse.dto.js';

const authRepository = new AuthRepository();

export async function verifyAuthenticatedSession(
  authSessionId: string,
  userId: string,
): Promise<AuthenticatedUserResponse> {
  const activeSession = await authRepository.findActiveAuthSession(authSessionId, userId);
  if (!activeSession) throw new UnauthorizedError(ERROR_MESSAGES.authenticationSessionInvalid);
  return mapDatabaseUserToAuthenticatedUserResponse(activeSession.user);
}
