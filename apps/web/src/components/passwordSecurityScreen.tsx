'use client';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_AUTH_VALIDATION_LIMITS, PASSWORD_RECOVERY_TIMING, AUTHORIZATION_SCHEME } from '../constants';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon, KeyIcon } from '@phosphor-icons/react/ssr';
import { UleyLogo } from './uleyLogo';
import { ThemeToggle } from './themeToggle';
import styles from './onboardingPage.module.css';

import { PasswordRecoveryStage, PasswordSecurityMode } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import { ProductIllustration } from './productIllustration';

type PasswordSecurityScreenProps = { mode: PasswordSecurityMode };

export function PasswordSecurityScreen({ mode }: PasswordSecurityScreenProps) {
  const [stage, setStage] = useState(PasswordRecoveryStage.EMAIL);
  const [emailAddress, setEmailAddress] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isChangingPassword = mode === PasswordSecurityMode.CHANGE_PASSWORD;

  async function submitRecoveryRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get('emailAddress') ?? emailAddress).trim();
    setEmailAddress(submittedEmail);
    try {
      await sendPasswordRecoveryRequest(submittedEmail);
      setStatusMessage(`If an account uses that email, a recovery code has been sent. It expires in ${PASSWORD_RECOVERY_TIMING.codeLifetimeInMinutes} minutes.`);
      setStage(PasswordRecoveryStage.CODE);
    } catch (requestError) {
      setErrorMessage(getRequestErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitOneTimeCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const oneTimeCode = String(new FormData(event.currentTarget).get('oneTimeCode') ?? '');
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.verifyPasswordResetCode}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ emailAddress, oneTimeCode }),
      });
      const responseBody = await readResponseBody(response);
      if (!response.ok) throw new Error(getApiResponseErrorMessage(responseBody?.error?.message ?? WEB_ERROR_MESSAGES.recoveryCodeInvalid, response.status, responseBody?.requestId));
      if (!responseBody?.resetToken) throw new Error(WEB_ERROR_MESSAGES.recoveryCodeInvalid);
      setResetToken(responseBody.resetToken);
      setStage(PasswordRecoveryStage.PASSWORD);
      setStatusMessage('Code verified. Choose a new password.');
    } catch (requestError) {
      setErrorMessage(getRequestErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') ?? '');
    if (newPassword !== formData.get('confirmPassword')) {
      setErrorMessage(WEB_ERROR_MESSAGES.passwordsDoNotMatch);
      setIsSubmitting(false);
      return;
    }
    try {
      await postJson(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.confirmPasswordReset}`, { resetToken, newPassword });
      setStage(PasswordRecoveryStage.COMPLETE);
      setStatusMessage('Your password has been reset. Sign in with your new password.');
    } catch (requestError) {
      setErrorMessage(getRequestErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitChangedPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') ?? '');
    if (newPassword !== formData.get('confirmPassword')) {
      setErrorMessage(WEB_ERROR_MESSAGES.passwordsDoNotMatch);
      setIsSubmitting(false);
      return;
    }
    const accessToken = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!accessToken) {
      setErrorMessage(WEB_ERROR_MESSAGES.sessionExpired);
      setIsSubmitting(false);
      return;
    }
    try {
      await postJson(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.changePassword}`, {
        currentPassword: formData.get('currentPassword'), newPassword,
      }, accessToken);
      window.sessionStorage.removeItem(WEB_AUTH_STORAGE_KEYS.accessToken);
      setStage(PasswordRecoveryStage.COMPLETE);
      setStatusMessage('Password changed. Your other sessions have been signed out; sign in again to continue.');
    } catch (requestError) {
      setErrorMessage(getRequestErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentFormHandler = isChangingPassword
    ? submitChangedPassword
    : stage === PasswordRecoveryStage.EMAIL ? submitRecoveryRequest : stage === PasswordRecoveryStage.CODE ? submitOneTimeCode : submitNewPassword;
  const heading = isChangingPassword ? 'Change your password' : stage === PasswordRecoveryStage.EMAIL ? 'Forgot your password?' : stage === PasswordRecoveryStage.CODE ? 'Enter your recovery code' : stage === PasswordRecoveryStage.PASSWORD ? 'Choose a new password' : 'Password updated';

  return (
    <main className={styles.page}>
      <header className={styles.topbar}><UleyLogo href="/" /><div className={styles.topbarActions}><ThemeToggle /><Link href={isChangingPassword ? '/' : '/login'}><ArrowLeftIcon size={14} /> {isChangingPassword ? 'Back to Uley' : 'Back to sign in'}</Link></div></header>
      <div className={`${styles.layout} ${styles.securityLayout}`}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}><KeyIcon size={15} /> ACCOUNT SECURITY</p>
          <h1>{isChangingPassword ? <>Keep your account<br /><span>in your hands.</span></> : <>A secure way<br /><span>back into Uley.</span></>}</h1>
          <p className={styles.introCopy}>{isChangingPassword ? 'Choose a strong password you have not used before. We will sign out your active sessions after the change.' : 'We’ll verify the email on your account before allowing a password reset.'}</p>
          <p className={styles.sideNote}><strong>{isChangingPassword ? 'Your password is private' : 'One-time recovery'}</strong>{isChangingPassword ? 'Uley will never ask you to share your password by email or message.' : `Recovery codes expire after ${PASSWORD_RECOVERY_TIMING.codeLifetimeInMinutes} minutes and can only be used once.`}</p>
          <div className={styles.authIllustration}><ProductIllustration scene="passwordRecovery" /></div>
        </section>
        <section className={styles.card} aria-labelledby="security-heading">
          <div className={styles.cardHeading}><p>{isChangingPassword ? 'SIGNED-IN ACCOUNT' : stage === PasswordRecoveryStage.EMAIL ? 'PASSWORD RECOVERY · 01 / 03' : stage === PasswordRecoveryStage.CODE ? 'PASSWORD RECOVERY · 02 / 03' : 'PASSWORD RECOVERY · 03 / 03'}</p><h2 id="security-heading">{heading}</h2></div>
          {stage === PasswordRecoveryStage.COMPLETE ? <div className={styles.success} role="status"><CheckCircleIcon size={18} /> {statusMessage} <Link href="/login">Sign in</Link></div> : <form onSubmit={currentFormHandler}>
            {!isChangingPassword && stage === PasswordRecoveryStage.EMAIL && <div className={styles.field}><label htmlFor="emailAddress">Email address</label><input id="emailAddress" name="emailAddress" type="email" autoComplete="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} placeholder="you@example.com" required /></div>}
            {!isChangingPassword && stage === PasswordRecoveryStage.CODE && <><p className={styles.hint}>{statusMessage} Enter the six-digit code below.</p><div className={styles.field}><label htmlFor="oneTimeCode">Six-digit code</label><input id="oneTimeCode" name="oneTimeCode" inputMode="numeric" autoComplete="one-time-code" pattern={`[0-9]{${WEB_AUTH_VALIDATION_LIMITS.passwordResetCodeLength}}`} maxLength={WEB_AUTH_VALIDATION_LIMITS.passwordResetCodeLength} placeholder="000000" required /></div></>}
            {(isChangingPassword || stage === PasswordRecoveryStage.PASSWORD) && <>
              {isChangingPassword && <div className={styles.field}><label htmlFor="currentPassword">Current password</label><input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></div>}
              <PasswordFields />
            </>}
            {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
            <button className={styles.submit} type="submit" disabled={isSubmitting}><span>{isSubmitting ? 'Please wait…' : isChangingPassword ? 'Change password' : stage === PasswordRecoveryStage.EMAIL ? 'Send recovery code' : stage === PasswordRecoveryStage.CODE ? 'Verify code' : 'Reset password'}</span><span className={styles.submitIcon}><ArrowRightIcon size={19} weight="bold" /></span></button>
            {!isChangingPassword && stage === PasswordRecoveryStage.CODE && <button className={styles.textButton} type="button" disabled={isSubmitting} onClick={() => void resendPasswordCode(emailAddress, setErrorMessage, setStatusMessage)}>Send another code</button>}
          </form>}
          {!isChangingPassword && stage !== PasswordRecoveryStage.COMPLETE && <p className={styles.cardFoot}>Remembered it? <Link href="/login">Sign in</Link></p>}
        </section>
      </div>
    </main>
  );
}

function PasswordFields() {
  return <><div className={styles.field}><label htmlFor="newPassword">New password</label><input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} maxLength={WEB_AUTH_VALIDATION_LIMITS.passwordMaximumLength} required /><span className={styles.hint}>Use at least {WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters.</span></div><div className={styles.field}><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} maxLength={WEB_AUTH_VALIDATION_LIMITS.passwordMaximumLength} required /></div></>;
}

async function readResponseBody(response: Response) {
  return response.json().catch(() => null) as Promise<{ error?: { message?: string }; requestId?: string; resetToken?: string } | null>;
}

async function postJson(url: string, body: unknown, accessToken?: string) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `${AUTHORIZATION_SCHEME} ${accessToken}` } : {}) }, body: JSON.stringify(body), credentials: 'include' });
  const responseBody = await readResponseBody(response);
  if (!response.ok) throw new Error(getApiResponseErrorMessage(responseBody?.error?.message ?? WEB_ERROR_MESSAGES.requestFailed, response.status, responseBody?.requestId));
}

async function sendPasswordRecoveryRequest(emailAddress: string) {
  await postJson(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.requestPasswordReset}`, { emailAddress });
}

async function resendPasswordCode(emailAddress: string, setErrorMessage: (message: string) => void, setStatusMessage: (message: string) => void) {
  setErrorMessage('');
  try {
    await sendPasswordRecoveryRequest(emailAddress);
    setStatusMessage('If an account uses that email, a recovery code has been sent. Check your inbox.');
  } catch (requestError) {
    setErrorMessage(getRequestErrorMessage(requestError));
  }
}

function getRequestErrorMessage(requestError: unknown): string {
  return getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailed);
}
