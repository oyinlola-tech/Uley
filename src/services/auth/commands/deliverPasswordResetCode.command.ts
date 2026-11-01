import nodemailer from 'nodemailer';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { AUTH_SECURITY_CONSTANTS } from '../../../constants/authSecurity.constant.js';
import { AUTH_EMAIL_CONTENT } from '../../../constants/authEmail.constant.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';

export async function deliverPasswordResetCode(emailAddress: string, oneTimeCode: string): Promise<void> {
  if (!applicationEnvironment.smtpHost || !applicationEnvironment.smtpFromAddress) {
    throw new Error(ERROR_MESSAGES.smtpNotConfigured);
  }

  const smtpTransport = nodemailer.createTransport({
    host: applicationEnvironment.smtpHost,
    port: applicationEnvironment.smtpPort,
    secure: applicationEnvironment.smtpPort === AUTH_SECURITY_CONSTANTS.smtpTlsPort,
    auth: applicationEnvironment.smtpUsername && applicationEnvironment.smtpPassword
      ? { user: applicationEnvironment.smtpUsername, pass: applicationEnvironment.smtpPassword }
      : undefined,
  });
  await smtpTransport.sendMail({
    from: applicationEnvironment.smtpFromAddress,
    to: emailAddress,
    subject: AUTH_EMAIL_CONTENT.passwordRecoverySubject,
    text: `Your Uley password recovery code is ${oneTimeCode}. It expires in ${AUTH_SECURITY_CONSTANTS.passwordResetCodeLifetimeInMilliseconds / 60_000} minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your Uley password recovery code is <strong>${oneTimeCode}</strong>.</p><p>It expires in ${AUTH_SECURITY_CONSTANTS.passwordResetCodeLifetimeInMilliseconds / 60_000} minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
