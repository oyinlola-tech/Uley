import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { UnauthorizedError } from '../../../errors/app.error.js';
import { PasswordRecoveryRepository } from '../../../repositories/passwordRecovery.repository.js';
import { hashAccountPassword } from '../../../utils/password.js';
import { hashPasswordResetToken } from '../../../utils/passwordResetCode.js';

const passwordRecoveryRepository = new PasswordRecoveryRepository();

export interface ResetAccountPasswordCommand {
  resetToken: string;
  newPlainTextPassword: string;
}

export async function resetAccountPassword(command: ResetAccountPasswordCommand): Promise<void> {
  const newPasswordHash = await hashAccountPassword(command.newPlainTextPassword);
  const resetWasCompleted = await passwordRecoveryRepository.updatePasswordFromResetToken(
    hashPasswordResetToken(command.resetToken),
    newPasswordHash,
    new Date(),
  );
  if (!resetWasCompleted) throw new UnauthorizedError(ERROR_MESSAGES.recoverySessionInvalid);
}
