'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import { UleyLogo } from './uleyLogo';
import styles from './siteChrome.module.css';
import { PUBLIC_ROUTES } from '../constants';
import { AccountRole, isAdminAccountRole } from '../enums';
import { useWebSessionRole } from './useWebSessionRole';

type FooterLink = { href: string; label: string };
type FooterGroup = { title: string; links: FooterLink[] };
type FooterContent = {
  kicker: string;
  heading: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
  groups: FooterGroup[];
};

const publicStudentLinks: FooterLink[] = [
  { href: PUBLIC_ROUTES.browseHomes, label: 'Browse available homes' },
  { href: PUBLIC_ROUTES.studentGuide, label: 'The student guide' },
  { href: PUBLIC_ROUTES.whatWeCheck, label: 'Landlord & property checks' },
  { href: '/onboarding/student', label: 'Create a student account' },
];

const publicLandlordLinks: FooterLink[] = [
  { href: PUBLIC_ROUTES.forLandlords, label: 'For landlords' },
  { href: PUBLIC_ROUTES.whatWeCheck, label: 'How homes are reviewed' },
  { href: PUBLIC_ROUTES.landlordRegistration, label: 'List a property' },
];

const studentWorkspaceLinks: FooterLink[] = [
  { href: '/listings', label: 'Browse homes' },
  { href: '/inspections', label: 'My inspections' },
  { href: '/messages', label: 'Messages' },
  { href: '/flatmates', label: 'Find a flatmate' },
  { href: '/my-profile', label: 'My profile' },
];

const landlordWorkspaceLinks: FooterLink[] = [
  { href: '/landlord', label: 'My properties' },
  { href: '/landlord/inspections', label: 'Inspection requests' },
  { href: '/landlord/complaints', label: 'Housing issues' },
  { href: '/landlord/ads', label: 'Promoted listings' },
  { href: '/messages', label: 'Messages' },
];

function getFooterContent(role: AccountRole | null): FooterContent {
  if (role === AccountRole.STUDENT) return {
    kicker: 'YOUR SEARCH, ALL IN ONE PLACE', heading: <>Keep your housing<br />search <em>moving forward.</em></>,
    ctaHref: '/listings', ctaLabel: 'Browse available homes',
    groups: [{ title: 'Your Uley', links: studentWorkspaceLinks }, { title: 'Plan your search', links: [
      { href: PUBLIC_ROUTES.studentGuide, label: 'The student guide' },
      { href: PUBLIC_ROUTES.whatWeCheck, label: 'What we check' },
      { href: '/complaints', label: 'Housing support' },
    ] }],
  };
  if (role === AccountRole.LANDLORD) return {
    kicker: 'PROPERTY OWNER WORKSPACE', heading: <>Your homes and requests,<br /><em>in one place.</em></>,
    ctaHref: '/landlord', ctaLabel: 'Open property workspace',
    groups: [{ title: 'Manage properties', links: landlordWorkspaceLinks }, { title: 'Uley for landlords', links: [
      { href: PUBLIC_ROUTES.forLandlords, label: 'Landlord guide' },
      { href: PUBLIC_ROUTES.whatWeCheck, label: 'How homes are reviewed' },
      { href: '/my-profile', label: 'My profile' },
    ] }],
  };
  if (role === AccountRole.CARETAKER) return {
    kicker: 'PROPERTY CARETAKER WORKSPACE', heading: <>Resident issues for<br /><em>your assigned homes.</em></>,
    ctaHref: '/caretaker/complaints', ctaLabel: 'Open assigned issues',
    groups: [{ title: 'Your work', links: [{ href: '/caretaker/complaints', label: 'Assigned housing issues' }, { href: '/messages', label: 'Messages' }] }, { title: 'Your account', links: [
      { href: '/my-profile', label: 'My profile' }, { href: '/change-password', label: 'Change password' }, { href: PUBLIC_ROUTES.privacy, label: 'Privacy and data' },
    ] }],
  };
  if (role === AccountRole.BUSINESS_ADVERTISER) return {
    kicker: 'LOCAL BUSINESS CAMPAIGNS', heading: <>Create, review, and measure<br /><em>your Uley ads.</em></>,
    ctaHref: '/ads', ctaLabel: 'Open Ads Manager',
    groups: [{ title: 'Manage campaigns', links: [{ href: '/ads', label: 'Ads Manager' }, { href: '/ads/analytics', label: 'Campaign analytics' }, { href: '/messages', label: 'Messages' }] }, { title: 'Your account', links: [
      { href: '/my-profile', label: 'Business profile' },
      { href: '/change-password', label: 'Change password' },
      { href: PUBLIC_ROUTES.privacy, label: 'Privacy and data' },
    ] }],
  };
  if (role && isAdminAccountRole(role)) return {
    kicker: 'SCHOOL ADMIN WORKSPACE', heading: <>Review activity<br />from your <em>workspace.</em></>,
    ctaHref: '/admin', ctaLabel: 'Open admin workspace',
    groups: [{ title: 'Admin workspace', links: [{ href: '/admin', label: 'Admin overview' }] }, { title: 'Account & guidance', links: [
      { href: '/change-password', label: 'Change password' },
      { href: PUBLIC_ROUTES.howItWorks, label: 'How Uley works' },
      { href: PUBLIC_ROUTES.privacy, label: 'Privacy and data' },
    ] }],
  };
  if (role) return {
    kicker: 'YOUR ULEY ACCOUNT', heading: <>Your account is ready<br />when you <em>are.</em></>,
    ctaHref: '/change-password', ctaLabel: 'Manage your account',
    groups: [{ title: 'Explore Uley', links: [
      { href: PUBLIC_ROUTES.browseHomes, label: 'Browse homes' },
      { href: PUBLIC_ROUTES.studentGuide, label: 'The student guide' },
      { href: PUBLIC_ROUTES.howItWorks, label: 'How Uley works' },
    ] }, { title: 'Your account', links: [{ href: '/messages', label: 'Messages' }, { href: '/change-password', label: 'Change password' }] }],
  };
  return {
    kicker: 'OFF-CAMPUS LIVING, MADE CLEARER', heading: <>A good place<br />starts with <em>good questions.</em></>,
    ctaHref: '/onboarding/student', ctaLabel: 'Create your student account',
    groups: [{ title: 'Students', links: publicStudentLinks }, { title: 'Property owners', links: publicLandlordLinks }],
  };
}

function FooterLinks({ title, links }: FooterGroup) {
  return (
    <div className={styles.footerLinkGroup}>
      <h3>{title}</h3>
      {links.map(({ href, label }) => (
        <Link href={href} key={label}>{label}<ArrowUpRightIcon size={15} aria-hidden="true" /></Link>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const content = getFooterContent(useWebSessionRole());
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerCallout}>
        <div className={`${styles.footerCalloutInner} page-container`}>
          <section className={styles.footerFeature} aria-labelledby="footer-heading">
            <p className={styles.footerKicker}>{content.kicker}</p>
            <h2 id="footer-heading">{content.heading}</h2>
            <Link className={styles.footerCta} href={content.ctaHref}>
              {content.ctaLabel} <ArrowUpRightIcon size={18} weight="bold" aria-hidden="true" />
            </Link>
          </section>
          <CampusIllustration />
        </div>
      </div>
      <div className={styles.footerDirectory}>
        <div className={`${styles.footerDirectoryInner} page-container`}>
          <div className={styles.footerBrandColumn}>
            <UleyLogo href="/#top" inverse />
            <p>Independent guidance for students finding a home off campus.</p>
          </div>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            {content.groups.map((group) => <FooterLinks key={group.title} {...group} />)}
          </nav>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Uley</span>
            <span>Find. Visit. Decide.</span>
            <div className={styles.footerLegalLinks}>
              <Link href={PUBLIC_ROUTES.privacy}>Privacy</Link>
              <Link href={PUBLIC_ROUTES.cookies}>Cookies</Link>
              <Link href={PUBLIC_ROUTES.terms}>Terms</Link>
            </div>
            <Link href="/#top">Back to the start ↑</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CampusIllustration() {
  return (
    <svg className={styles.footerIllustration} viewBox="0 0 560 330" role="img" aria-label="Illustration of a welcoming campus neighborhood">
      <path d="M0 286h560v44H0z" fill="var(--color-primary-action)" />
      <path d="M18 286V157l100-79 100 79v129z" fill="var(--color-illustration-cream)" />
      <path d="M174 286V128l93-72 93 72v158z" fill="var(--color-illustration-sand)" />
      <path d="M326 286V169l89-68 89 68v117z" fill="var(--color-surface)" />
      <path d="M47 167h37v42H47zm83 0h37v42h-37zm-45 67h39v52H85z" fill="var(--color-illustration-window)" />
      <path d="M204 139h34v39h-34zm89 0h34v39h-34zm-46 56h49v91h-49z" fill="var(--color-illustration-terracotta)" />
      <path d="M352 181h34v38h-34zm82 0h34v38h-34zm-41 45h39v60h-39z" fill="var(--color-illustration-window)" />
      <path d="M0 286c76-28 112-18 176 0s132 18 204-1 120-28 180 1" fill="none" stroke="var(--color-citrus)" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 19" />
      <circle cx="38" cy="270" r="18" fill="var(--color-trust-green)" /><circle cx="38" cy="245" r="13" fill="var(--color-illustration-leaf)" />
      <circle cx="515" cy="268" r="20" fill="var(--color-trust-green)" /><circle cx="515" cy="239" r="14" fill="var(--color-illustration-leaf)" />
      <path d="m263 244 17-15 17 15v22h-34zm11 22v-13h12v13" fill="none" stroke="var(--color-illustration-cream)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
