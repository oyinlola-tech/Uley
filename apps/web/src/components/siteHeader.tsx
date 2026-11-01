'use client';

import Link from 'next/link';
import { ArrowUpRightIcon, XIcon } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { UleyLogo } from './uleyLogo';
import { ThemeToggle } from './themeToggle';
import styles from './siteChrome.module.css';
import { PUBLIC_ROUTES } from '../constants';
import { useWebSessionRole } from './useWebSessionRole';

const navigationRoutes = [
  { href: PUBLIC_ROUTES.browseHomes, number: '00', label: 'Browse homes', note: 'Search verified off-campus listings' },
  { href: PUBLIC_ROUTES.studentGuide, number: '01', label: 'The student guide', note: 'Search · inspect · apply' },
  { href: PUBLIC_ROUTES.whatWeCheck, number: '02', label: 'What we check', note: 'Landlords · properties · details' },
  { href: PUBLIC_ROUTES.forLandlords, number: '03', label: 'For landlords', note: 'Introduce your home clearly' },
  { href: PUBLIC_ROUTES.howItWorks, number: '04', label: 'How Uley works', note: 'See what is live and how data moves' },
];

export function SiteHeader() {
  const role = useWebSessionRole();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  if (role) return null;

  function closeMobileNavigation() {
    setIsMobileNavigationOpen(false);
  }

  function toggleMobileNavigation() {
    setIsMobileNavigationOpen((isCurrentlyOpen) => !isCurrentlyOpen);
  }

  return (
    <header className={styles.siteHeader}>
      <div className={`${styles.siteHeaderInner} page-container`}>
        <div className={styles.brandBlock}>
          <UleyLogo href="/#top" onClick={closeMobileNavigation} />
          <span className={styles.brandDescriptor}>CAMPUS HOUSING GUIDE</span>
        </div>

        <nav
          className={`${styles.primaryNavigation}${isMobileNavigationOpen ? ` ${styles.primaryNavigationOpen}` : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          <div className={styles.mobileNavigationHeading}>
            <span>GET YOUR BEARINGS</span>
            <p>Where would you like to go?</p>
          </div>
          <div className={styles.mobileNavigationRoutes}>
            {navigationRoutes.map((route) => (
              <Link className={styles.navigationLink} href={route.href} key={route.number} onClick={closeMobileNavigation}>
                <span className={styles.navigationIndex}>{route.number}</span>
                <span className={styles.navigationText}><strong>{route.label}</strong><small>{route.note}</small></span>
                <ArrowUpRightIcon size={22} weight="regular" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link className={styles.navigationCta} href="/onboarding" onClick={closeMobileNavigation}>
            Choose your Uley path <ArrowUpRightIcon size={16} weight="bold" aria-hidden="true" />
          </Link>
        </nav>

        <div className={styles.desktopNavigation} aria-label="Explore Uley">
          {navigationRoutes.map(({ href, label }) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </div>
        <Link className={styles.desktopAccountAction} href="/onboarding">Get started <ArrowUpRightIcon size={15} weight="bold" aria-hidden="true" /></Link>
        <ThemeToggle />

        <button
          className={styles.mobileMenuButton}
          type="button"
          aria-label={isMobileNavigationOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileNavigationOpen}
          aria-controls="primary-navigation"
          onClick={toggleMobileNavigation}
        >
          {isMobileNavigationOpen ? <XIcon size={19} weight="bold" aria-hidden="true" /> : <span>MENU <span aria-hidden="true">+</span></span>}
        </button>
      </div>
    </header>
  );
}
