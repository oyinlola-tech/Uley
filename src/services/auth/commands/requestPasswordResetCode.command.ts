import { AuthRepository } from '../../../repositories/auth.repository.js';
import { PasswordRecoveryRepository } from '../../../repositories/passwordRecovery.repository.js';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { createPasswordResetCode, hashPasswordResetCode } from '../../../utils/passwordResetCode.js';
import { deliverPasswordResetCode } from './deliverPasswordResetCode.command.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { NodeEnvironment } from '../../../enums/nodeEnvironment.enum.js';

const authRepository = new AuthRepository();
const passwordRecoveryRepository = new PasswordRecoveryRepository();
type PasswordRecoveryLogger = { error: (context: { err: unknown }, message: string) => void };

export interface RequestPasswordResetCodeCommand {
  emailAddress: string;
}

export async function requestPasswordResetCode(command: RequestPasswordResetCodeCommand, logger?: PasswordRecoveryLogger): Promise<void> {
  if (applicationEnvironment.nodeEnvironment === NodeEnvironment.PRODUCTION
    && (!applicationEnvironment.smtpHost || !applicationEnvironment.smtpFromAddress)) {
    throw new Error(ERROR_MESSAGES.smtpNotConfigured);
  }
  const account = await authRepository.findUserByEmail(command.emailAddress);
  if (!account || !account.isActive) return;

  const currentTime = new Date();
  const cooldownRecord = await passwordRecoveryRepository.findPasswordResetCooldownRecord(
    command.emailAddress,
    new Date(currentTime.getTime() - AUTH_SECURITY_CONSTANTS.passwordResetResendCooldownInMilliseconds),
  );
  if (cooldownRecord) return;

  await passwordRecoveryRepository.consumePreviousPasswordResetChallenges(command.emailAddress, currentTime);
  const oneTimeCode = createPasswordResetCode();
  const resetChallenge = await passwordRecoveryRepository.createPasswordResetChallenge({
    emailAddress: command.emailAddress,
    codeHash: hashPasswordResetCode(command.emailAddress, oneTimeCode),
    expiresAt: new Date(currentTime.getTime() + AUTH_SECURITY_CONSTANTS.passwordResetCodeLifetimeInMilliseconds),
  });

  try {
    await deliverPasswordResetCode(command.emailAddress, oneTimeCode);
  } catch (deliveryError) {
    await passwordRecoveryRepository.consumePasswordResetChallenge(resetChallenge.id, new Date());
    logger?.error({ err: deliveryError }, ERROR_MESSAGES.passwordRecoveryDeliveryFailed);
  }
}
