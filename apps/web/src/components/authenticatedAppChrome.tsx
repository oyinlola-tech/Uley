'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BuildingsIcon, CalendarCheckIcon, ChatCircleDotsIcon, HouseLineIcon, UserCircleIcon } from '@phosphor-icons/react/ssr';
import { useEffect, useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_SESSION_CHANGED_EVENT, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { AccountRole, isAdminAccountRole } from '../enums';
import { WEB_ERROR_MESSAGES } from '../errors';
import { UleyLogo } from './uleyLogo';
import { ThemeToggle } from './themeToggle';
import { useWebSessionRole } from './useWebSessionRole';
import styles from './authenticatedAppChrome.module.css';

export function AuthenticatedAppChrome({ children }: { children: React.ReactNode }) {
  const role = useWebSessionRole();
  const pathname = usePathname();
  const router = useRouter();
  const [signOutError, setSignOutError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  if (!role) return <>{children}</>;
  const isAdmin = isAdminAccountRole(role);
  const isLandlord = role === AccountRole.LANDLORD;
  const isBusinessAdvertiser = role === AccountRole.BUSINESS_ADVERTISER;
  const isCaretaker = role === AccountRole.CARETAKER;
  const links = isAdmin
    ? [{ label: 'Dashboard', shortLabel: 'Admin', href: '/admin', Icon: BuildingsIcon }, { label: 'Inspections', shortLabel: 'Visits', href: '/admin/inspections', Icon: CalendarCheckIcon }, { label: 'Account', shortLabel: 'Account', href: '/change-password', Icon: UserCircleIcon }]
      : isCaretaker
        ? [{ label: 'Assigned issues', shortLabel: 'Issues', href: '/caretaker/complaints', Icon: BuildingsIcon }, { label: 'Messages', shortLabel: 'Messages', href: '/messages', Icon: ChatCircleDotsIcon }, { label: 'Account', shortLabel: 'Account', href: '/my-profile', Icon: UserCircleIcon }]
      : isBusinessAdvertiser
        ? [{ label: 'Ads manager', shortLabel: 'Ads', href: '/ads', Icon: BuildingsIcon }, { label: 'Analytics', shortLabel: 'Results', href: '/ads/analytics', Icon: CalendarCheckIcon }, { label: 'Messages', shortLabel: 'Messages', href: '/messages', Icon: ChatCircleDotsIcon }, { label: 'Account', shortLabel: 'Account', href: '/my-profile', Icon: UserCircleIcon }]
      : isLandlord
      ? [{ label: 'Properties', shortLabel: 'Homes', href: '/landlord', Icon: HouseLineIcon }, { label: 'Ads manager', shortLabel: 'Ads', href: '/landlord/ads', Icon: BuildingsIcon }, { label: 'Inspections', shortLabel: 'Visits', href: '/landlord/inspections', Icon: CalendarCheckIcon }, { label: 'Messages', shortLabel: 'Messages', href: '/messages', Icon: ChatCircleDotsIcon }, { label: 'Account', shortLabel: 'Account', href: '/my-profile', Icon: UserCircleIcon }]
      : [{ label: 'Browse homes', shortLabel: 'Homes', href: '/listings', Icon: HouseLineIcon }, { label: 'Ads manager', shortLabel: 'Ads', href: '/ads', Icon: BuildingsIcon }, { label: 'Inspections', shortLabel: 'Visits', href: '/inspections', Icon: CalendarCheckIcon }, { label: 'Housing issues', shortLabel: 'Issues', href: '/complaints', Icon: BuildingsIcon }, { label: 'Messages', shortLabel: 'Messages', href: '/messages', Icon: ChatCircleDotsIcon }, { label: 'Account', shortLabel: 'Account', href: '/my-profile', Icon: UserCircleIcon }];

  async function signOut() {
    const accessToken = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!accessToken) { finishSigningOut(); return; }
    setIsSigningOut(true);
    setSignOutError('');
    try {
      const response = await fetch(WEB_API_BASE_PATH + WEB_API_ENDPOINTS.signOut, { method: 'POST', headers: { authorization: 'Bearer ' + accessToken }, credentials: 'include' });
      if (!response.ok) throw new Error(WEB_ERROR_MESSAGES.signOutFailed);
      finishSigningOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : WEB_ERROR_MESSAGES.signOutFailed);
    } finally {
      setIsSigningOut(false);
    }
  }

  function finishSigningOut() {
    window.sessionStorage.removeItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    window.dispatchEvent(new Event(WEB_AUTH_SESSION_CHANGED_EVENT));
    router.replace('/');
  }

  return <div className={styles.shellAuthenticated} data-authenticated="true">
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.identity}><UleyLogo href={links[0].href} label="Uley workspace home" /><span className={styles.role}>{role.replaceAll('_', ' ')}</span></div>
        <nav className={styles.desktopNavigation} aria-label="Workspace navigation">{links.map(({ label, href }) => <Link key={href} href={href} aria-current={isCurrentWorkspacePath(pathname, href) ? 'page' : undefined}>{label}</Link>)}</nav>
        <div className={styles.actions}><ThemeToggle /><button className={styles.signOut} type="button" onClick={() => void signOut()} disabled={isSigningOut}>{isSigningOut ? 'Signing out…' : 'Sign out'}</button></div>
      </div>
      {signOutError && <p className={styles.signOutError} role="alert">{signOutError}</p>}
    </header>
    {children}
    <nav className={styles.bottomNavigation} aria-label="Workspace navigation">{links.map(({ shortLabel, href, Icon }) => <Link key={href} href={href} aria-current={isCurrentWorkspacePath(pathname, href) ? 'page' : undefined}><Icon size={20} aria-hidden="true" /><span>{shortLabel}</span></Link>)}</nav>
  </div>;
}

function isCurrentWorkspacePath(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'));
}
