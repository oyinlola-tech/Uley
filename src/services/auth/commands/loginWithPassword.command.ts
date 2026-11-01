import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { verifyAccountPassword, hashAccountPassword } from '../../../utils/password.js';
import { getApplicationUserRoleFromDatabaseRole } from './authResponse.dto.js';
import { createAuthSessionForUser } from './createAuthSession.command.js';
import type { AuthClientType } from '../../../enums/authClientType.enum.js';

export interface LoginWithPasswordCommand {
  emailAddress: string;
  plainTextPassword: string;
  clientType: AuthClientType;
  userAgent: string | null;
  ipAddress: string | null;
}

const authRepository = new AuthRepository();
const dummyPasswordHashPromise = hashAccountPassword('invalid-login-dummy-password');

export async function logInWithPassword(command: LoginWithPasswordCommand) {
  const user = await authRepository.findUserByEmail(command.emailAddress);
  const storedPasswordHash = user?.passwordHash ?? await dummyPasswordHashPromise;
  const submittedPasswordMatches = await verifyAccountPassword(command.plainTextPassword, storedPasswordHash);
  if (!user || !user.isActive || !submittedPasswordMatches) {
    throw new UnauthorizedError(ERROR_MESSAGES.credentialsInvalid);
  }
  return createAuthSessionForUser({ ...user, role: getApplicationUserRoleFromDatabaseRole(user.role) }, command);
}
