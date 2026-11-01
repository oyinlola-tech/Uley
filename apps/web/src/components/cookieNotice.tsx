'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION, COOKIE_NOTICE_COPY } from '../constants/cookieConsent.constant';
import styles from './cookieNotice.module.css';
import { useWebSessionRole } from './useWebSessionRole';

interface CookiePreferences {
  version: number;
  necessary: true;
  analytics: false;
  savedAt: string;
}

export function CookieNotice() {
  const role = useWebSessionRole();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(!window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    } catch {
      setIsVisible(true);
    }
    const reopenPreferences = () => setIsVisible(true);
    window.addEventListener('uley:cookie-settings', reopenPreferences);
    return () => window.removeEventListener('uley:cookie-settings', reopenPreferences);
  }, []);

  function continueWithNecessaryCookies() {
    const preferences: CookiePreferences = {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: false,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Cookie preferences are optional local settings; an unavailable store must not block the page.
    } finally {
      setIsVisible(false);
    }
  }

  if (!isVisible) return null;
  return (
    <aside className={[styles.notice, role ? styles.noticeAuthenticated : ''].filter(Boolean).join(' ')} aria-label="Cookie information">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>YOUR CHOICE</p>
        <h2>{COOKIE_NOTICE_COPY.title}</h2>
        <p>{COOKIE_NOTICE_COPY.description}</p>
        <Link href="/cookies">{COOKIE_NOTICE_COPY.details}</Link>
      </div>
      <button type="button" onClick={continueWithNecessaryCookies}>{COOKIE_NOTICE_COPY.continue}</button>
    </aside>
  );
}

export function CookieSettingsButton() {
  return (
    <button className={styles.settingsButton} type="button" onClick={() => window.dispatchEvent(new Event('uley:cookie-settings'))}>
      Review cookie choices
    </button>
  );
}
