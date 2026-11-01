import { ERROR_MESSAGES, UnauthorizedError } from '../../../errors/index.js';
import { PasswordRecoveryRepository } from '../../../repositories/passwordRecovery.repository.js';
import { createPasswordResetToken, hashPasswordResetToken, passwordResetCodeMatches } from '../../../utils/passwordResetCode.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';

const passwordRecoveryRepository = new PasswordRecoveryRepository();

export interface VerifyPasswordResetCodeCommand {
  emailAddress: string;
  oneTimeCode: string;
}

export async function verifyPasswordResetCode(command: VerifyPasswordResetCodeCommand): Promise<{ resetToken: string }> {
  const currentTime = new Date();
  const activeChallenge = await passwordRecoveryRepository.findActivePasswordResetChallenge(command.emailAddress, currentTime);
  if (!activeChallenge) throw new UnauthorizedError(ERROR_MESSAGES.recoveryCodeInvalid);

  const attemptWasRecorded = await passwordRecoveryRepository.incrementPasswordResetChallengeAttempts(activeChallenge.id, currentTime);
  if (!attemptWasRecorded || !passwordResetCodeMatches(command.oneTimeCode, activeChallenge.codeHash, command.emailAddress)) {
    throw new UnauthorizedError(ERROR_MESSAGES.recoveryCodeInvalid);
  }

  const resetToken = createPasswordResetToken();
  const tokenWasIssued = await passwordRecoveryRepository.issuePasswordResetToken({
    challengeId: activeChallenge.id,
    tokenHash: hashPasswordResetToken(resetToken),
    expiresAt: new Date(currentTime.getTime() + AUTH_SECURITY_CONSTANTS.passwordResetTokenLifetimeInMilliseconds),
  });
  if (!tokenWasIssued) throw new UnauthorizedError(ERROR_MESSAGES.recoveryCodeInvalid);
  return { resetToken };
}
