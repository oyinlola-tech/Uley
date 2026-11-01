import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { hashAccountPassword, verifyAccountPassword } from '../../../utils/password.js';

export interface ChangeAccountPasswordCommand {
  userId: string;
  currentPlainTextPassword: string;
  newPlainTextPassword: string;
}

const authRepository = new AuthRepository();

export async function changeAuthenticatedUserPassword(command: ChangeAccountPasswordCommand): Promise<void> {
  const user = await authRepository.findActiveUserById(command.userId);
  if (!user || !(await verifyAccountPassword(command.currentPlainTextPassword, user.passwordHash))) {
    throw new UnauthorizedError(ERROR_MESSAGES.currentPasswordInvalid);
  }
  const newPasswordHash = await hashAccountPassword(command.newPlainTextPassword);
  await authRepository.updatePasswordAndRevokeSessions(command.userId, newPasswordHash);
}
