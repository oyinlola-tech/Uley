'use client';
import { WEB_API_ENDPOINTS, WEB_AUTH_SESSION_CHANGED_EVENT, WEB_AUTH_STORAGE_KEYS, WEB_AUTH_VALIDATION_LIMITS } from '../constants';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@phosphor-icons/react/ssr';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { AccountRole, AuthClientType, AuthFormMode, isAdminAccountRole } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import styles from './onboardingPage.module.css';
import { WEB_UNLISTED_UNIVERSITY_COPY, WEB_UNLISTED_UNIVERSITY_VALUE } from '../constants';

type AccountFormMode = Exclude<AuthFormMode, AuthFormMode.CHOOSE>;
type RegistrationUniversity = { id: string; name: string; city: string; state: string };
type AccountFormProps = { mode: AccountFormMode; content: { label: string; button: string }; apiBaseUrl: string; nextPath?: string };

export function AccountForm({ mode, content, apiBaseUrl, nextPath }: AccountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [universities, setUniversities] = useState<RegistrationUniversity[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universityCity, setUniversityCity] = useState('');
  const [universityState, setUniversityState] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [isUniversityResultsOpen, setIsUniversityResultsOpen] = useState(true);
  const universityIsUnlisted = universityId === WEB_UNLISTED_UNIVERSITY_VALUE;
  const matchingUniversities = universities.filter((university) => `${university.name} ${university.city} ${university.state}`.toLowerCase().includes(universitySearch.trim().toLowerCase())).slice(0, 8);
  const selectedUniversity = universities.find((university) => university.id === universityId);

  useEffect(() => {
    if ([AuthFormMode.LOGIN, AuthFormMode.BUSINESS, AuthFormMode.CARETAKER].includes(mode)) return;
    void fetch(`${apiBaseUrl}${WEB_API_ENDPOINTS.universities}`).then(async (response) => {
      if (!response.ok) throw new Error(WEB_ERROR_MESSAGES.accountServiceUnavailable);
      const payload = await response.json() as { universities: RegistrationUniversity[] };
      setUniversities(payload.universities);
      if (payload.universities.length === 1) setUniversityId(payload.universities[0].id);
    }).catch((requestError: unknown) => setErrorMessage(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.accountServiceUnavailable)));
  }, [apiBaseUrl, mode]);

  async function submitAccountForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const emailAddress = String(formData.get('emailAddress') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      const authEndpoint = mode === AuthFormMode.BUSINESS
        ? WEB_API_ENDPOINTS.registerBusinessAdvertiser
        : mode === AuthFormMode.STUDENT
        ? WEB_API_ENDPOINTS.registerStudent
        : mode === AuthFormMode.LANDLORD
          ? WEB_API_ENDPOINTS.registerLandlord
          : mode === AuthFormMode.CARETAKER
            ? WEB_API_ENDPOINTS.registerCaretaker
          : WEB_API_ENDPOINTS.signIn;
      const response = await fetch(`${apiBaseUrl}${authEndpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(mode === AuthFormMode.LOGIN ? { emailAddress, password, clientType: AuthClientType.BROWSER } : mode === AuthFormMode.CARETAKER ? { fullName, emailAddress, password } : mode === AuthFormMode.BUSINESS ? {
          fullName,
          emailAddress,
          password,
          businessName: String(formData.get('businessName') ?? '').trim(),
          category: String(formData.get('businessCategory') ?? '').trim(),
          city: String(formData.get('businessCity') ?? '').trim(),
          websiteUrl: String(formData.get('websiteUrl') ?? '').trim(),
        } : {
          fullName,
          emailAddress,
          password,
          ...(universityIsUnlisted ? { unlistedUniversity: { name: universityName, city: universityCity, state: universityState } } : { universityId }),
        }),
      });
      const responseBody = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string; accessToken?: string; authenticatedUser?: { userRole?: AccountRole } } | null;
      if (!response.ok) throw new Error(getApiResponseErrorMessage(responseBody?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, responseBody?.requestId));
      if (mode === AuthFormMode.LOGIN) {
        if (!responseBody?.accessToken) throw new Error(WEB_ERROR_MESSAGES.signInSessionMissing);
        window.sessionStorage.setItem(WEB_AUTH_STORAGE_KEYS.accessToken, responseBody.accessToken);
        setAccountRole(responseBody.authenticatedUser?.userRole ?? null);
        window.dispatchEvent(new Event(WEB_AUTH_SESSION_CHANGED_EVENT));
        const userRole = responseBody.authenticatedUser?.userRole;
        const fallbackPath = userRole && isAdminAccountRole(userRole)
          ? '/admin'
          : userRole === AccountRole.LANDLORD ? '/landlord' : userRole === AccountRole.BUSINESS_ADVERTISER ? '/ads' : '/listings';
        const resolvedFallback = userRole === AccountRole.CARETAKER ? '/caretaker/complaints' : fallbackPath;
        const safeNextPath = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : resolvedFallback;
        router.replace(safeNextPath);
      }
      setIsComplete(true);
    } catch (requestError) {
      setErrorMessage(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="account-form-title">
      <div className={styles.cardHeading}><p>{mode === 'login' ? 'YOUR ACCOUNT' : 'A FEW DETAILS'}</p><h2 id="account-form-title">{content.label}</h2></div>
      {isComplete ? (
        <div className={styles.success} role="status">
          {mode === AuthFormMode.LOGIN ? 'You’re signed in. Your account session is ready.' : 'Your account has been created. Sign in to continue your Uley journey.'}
          {mode !== AuthFormMode.LOGIN && <> <Link href="/login">Go to sign in</Link></>}
          {mode === AuthFormMode.LOGIN && <><Link href={nextPath ?? (accountRole && isAdminAccountRole(accountRole) ? '/admin' : accountRole === AccountRole.LANDLORD ? '/landlord' : accountRole === AccountRole.CARETAKER ? '/caretaker/complaints' : accountRole === AccountRole.BUSINESS_ADVERTISER ? '/ads' : '/listings')}>{nextPath ? 'Continue where you left off' : accountRole && isAdminAccountRole(accountRole) ? 'Open admin dashboard' : accountRole === AccountRole.LANDLORD ? 'Open landlord workspace' : accountRole === AccountRole.CARETAKER ? 'Open assigned property issues' : accountRole === AccountRole.BUSINESS_ADVERTISER ? 'Open Ads Manager' : 'Browse listings'}</Link> <Link href="/change-password">Change password</Link></>}
        </div>
      ) : (
        <form onSubmit={submitAccountForm}>
          {mode !== AuthFormMode.LOGIN && <div className={styles.field}><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" placeholder="e.g. Amara Okafor" minLength={WEB_AUTH_VALIDATION_LIMITS.fullNameMinimumLength} maxLength={WEB_AUTH_VALIDATION_LIMITS.fullNameMaximumLength} required /></div>}
          {mode === AuthFormMode.BUSINESS && <>
            <div className={styles.field}><label htmlFor="businessName">Business name</label><input id="businessName" name="businessName" value={businessName} onChange={(event) => setBusinessName(event.target.value)} maxLength={160} required /></div>
            <div className={styles.field}><label htmlFor="businessCategory">What do you offer?</label><input id="businessCategory" name="businessCategory" value={businessCategory} onChange={(event) => setBusinessCategory(event.target.value)} placeholder="e.g. laundry, food, tutoring" maxLength={80} required /></div>
            <div className={styles.field}><label htmlFor="businessCity">City</label><input id="businessCity" name="businessCity" value={businessCity} onChange={(event) => setBusinessCity(event.target.value)} maxLength={120} required /></div>
            <div className={styles.field}><label htmlFor="websiteUrl">Website (optional)</label><input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" /></div>
          </>}
          {(mode === AuthFormMode.STUDENT || mode === AuthFormMode.LANDLORD) && <div className={styles.universityChooser}>
            <div><strong>Choose your university</strong><p>Search public universities by name, city, or state.</p></div>
            {selectedUniversity && <div className={styles.selectedUniversity}><span><strong>{selectedUniversity.name}</strong><small>{selectedUniversity.city}, {selectedUniversity.state}</small></span><button type="button" onClick={() => { setUniversityId(''); setIsUniversityResultsOpen(true); }}>Change</button></div>}
            <label className={styles.srOnly} htmlFor="universitySearch">{WEB_UNLISTED_UNIVERSITY_COPY.search}</label>
            <input id="universitySearch" role="combobox" aria-autocomplete="list" aria-expanded={isUniversityResultsOpen} aria-controls="university-search-results" value={universitySearch} onFocus={() => setIsUniversityResultsOpen(true)} onChange={(event) => { setUniversitySearch(event.target.value); setUniversityId(''); setIsUniversityResultsOpen(true); }} placeholder={WEB_UNLISTED_UNIVERSITY_COPY.searchPlaceholder} />
            {isUniversityResultsOpen && <div id="university-search-results" className={styles.universityResults} role="listbox" aria-label="Public university matches">{matchingUniversities.map((university) => <button type="button" role="option" aria-selected={universityId === university.id} key={university.id} onClick={() => { setUniversityId(university.id); setUniversitySearch(university.name); setIsUniversityResultsOpen(false); }}><span><strong>{university.name}</strong><small>{university.city}, {university.state}</small></span><span aria-hidden="true">↗</span></button>)}{universitySearch.trim() !== '' && matchingUniversities.length === 0 && <p>{WEB_UNLISTED_UNIVERSITY_COPY.noMatches}</p>}{universities.length === 0 && <p>University list is loading. You can add an unlisted school below.</p>}</div>}
            <button className={styles.unlistedChoice} type="button" aria-pressed={universityIsUnlisted} onClick={() => { setUniversityId(universityIsUnlisted ? '' : WEB_UNLISTED_UNIVERSITY_VALUE); setIsUniversityResultsOpen(false); }}>{WEB_UNLISTED_UNIVERSITY_COPY.option} <span aria-hidden="true">→</span></button>
          </div>}
          {(mode === AuthFormMode.STUDENT || mode === AuthFormMode.LANDLORD) && universityIsUnlisted && <div className={styles.unlistedUniversity}><strong>{WEB_UNLISTED_UNIVERSITY_COPY.heading}</strong><p>{WEB_UNLISTED_UNIVERSITY_COPY.detail}</p><div className={styles.field}><label htmlFor="universityName">{WEB_UNLISTED_UNIVERSITY_COPY.name}</label><input id="universityName" value={universityName} onChange={(event) => setUniversityName(event.target.value)} maxLength={180} required /></div><div className={styles.field}><label htmlFor="universityCity">{WEB_UNLISTED_UNIVERSITY_COPY.city}</label><input id="universityCity" value={universityCity} onChange={(event) => setUniversityCity(event.target.value)} maxLength={120} required /></div><div className={styles.field}><label htmlFor="universityState">{WEB_UNLISTED_UNIVERSITY_COPY.state}</label><input id="universityState" value={universityState} onChange={(event) => setUniversityState(event.target.value)} maxLength={120} required /></div></div>}
          <div className={styles.field}><label htmlFor="emailAddress">Email address</label><input id="emailAddress" name="emailAddress" type="email" autoComplete="email" placeholder="you@example.com" maxLength={WEB_AUTH_VALIDATION_LIMITS.emailMaximumLength} required /></div>
          <div className={styles.field}><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === AuthFormMode.LOGIN ? 'current-password' : 'new-password'} placeholder={mode === AuthFormMode.LOGIN ? 'Enter your password' : `At least ${WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters`} minLength={mode === AuthFormMode.LOGIN ? 1 : WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} maxLength={WEB_AUTH_VALIDATION_LIMITS.passwordMaximumLength} required />{mode !== AuthFormMode.LOGIN && <span className={styles.hint}>Use at least {WEB_AUTH_VALIDATION_LIMITS.passwordMinimumLength} characters. A longer passphrase is easier to remember.</span>}{mode === AuthFormMode.LOGIN && <span className={styles.hint}><Link href="/forgot-password">Forgot password?</Link></span>}</div>
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
          <button className={styles.submit} type="submit" disabled={isSubmitting || (mode !== AuthFormMode.LOGIN && mode !== AuthFormMode.BUSINESS && (!universityId || (universityIsUnlisted && (!universityName.trim() || !universityCity.trim() || !universityState.trim())))) || (mode === AuthFormMode.BUSINESS && (!businessName.trim() || !businessCategory.trim() || !businessCity.trim()))}><span>{isSubmitting ? 'Please wait…' : content.button}</span><span className={styles.submitIcon}><ArrowRightIcon size={19} weight="bold" /></span></button>
        </form>
      )}
      <p className={styles.cardFoot}>{mode === AuthFormMode.LOGIN ? <>New to Uley? <Link href="/onboarding">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</p>
    </section>
  );
}
