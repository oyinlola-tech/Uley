import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { mapDatabaseUserToAuthenticatedUserResponse } from '../commands/authResponse.dto.js';
import type { AuthenticatedUserResponse } from '../commands/authResponse.dto.js';

export interface GetCurrentUserQuery {
  authenticatedUserId: string;
}

const authRepository = new AuthRepository();

export async function getAuthenticatedUser(query: GetCurrentUserQuery): Promise<AuthenticatedUserResponse> {
  const user = await authRepository.findActiveUserById(query.authenticatedUserId);
  if (!user) throw new UnauthorizedError(ERROR_MESSAGES.accountUnavailable);
  return mapDatabaseUserToAuthenticatedUserResponse(user);
}
