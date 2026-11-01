import type { Metadata } from 'next';
import { CookieSettingsButton } from './cookieNotice';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './policyPage.module.css';

export const cookieMetadata: Metadata = {
  title: 'Cookies and browser storage | Uley',
  description: 'See the cookies and on-device browser storage used by Uley.',
};

export function CookiePolicyPage() {
  return <ProductGuideFrame><main className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>COOKIES AND DEVICE STORAGE</p>
      <h1>Know what stays in your browser.</h1>
      <p className={styles.lead}>Uley currently uses a necessary authentication cookie. Sponsored listing counts are sent as first-party application events; the app does not use advertising cookies, cross-site tracking, or profiling.</p>
      <p className={styles.updated}>Updated 31 October 2026</p>
    </header>
    <section className={styles.section}><h2>Necessary sign-in cookie</h2><p><strong>uley_refresh_token</strong> keeps a browser account session active and supports secure sign-in renewal. The API marks it HttpOnly, uses SameSite=Strict, limits its path to authentication routes, and sets Secure in production. Its maximum age follows the configured refresh-token lifetime (30 days by default).</p><p>This cookie is essential to the sign-in service. The site does not use it for advertising or analytics.</p></section>
    <section className={styles.section}><h2>Browser storage that is not a cookie</h2><ul><li><strong>Theme preference:</strong> light or dark mode is stored in local storage.</li><li><strong>Property drafts and upload resume data:</strong> unfinished work and transfer metadata may be saved on this device to support offline continuation or retries.</li><li><strong>Cookie choice:</strong> the preference panel stores its version and necessary-only choice in local storage; this choice is not sent to Uley’s API.</li></ul><p>Browser storage stays on the device until site data is cleared or the app removes it. Do not use a shared device for private drafts or sign-in.</p></section>
    <section className={styles.section}><h2>Optional cookies</h2><p>Analytics and advertising cookies are not active. Uley does not load those services. The cookie notice therefore records only a necessary-cookie choice; it does not enable an optional tracker.</p></section>
    <section className={styles.section}><h2>Manage the choice</h2><p>You can clear local website data through your browser settings. Clearing the authentication cookie signs you out. Clearing local storage may remove saved theme preferences, drafts, upload-resume data, and the cookie notice choice.</p><div className={styles.actions}><CookieSettingsButton /></div></section>
  </main></ProductGuideFrame>;
}
