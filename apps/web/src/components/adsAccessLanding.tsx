import Link from 'next/link';
import { ArrowUpRightIcon, BriefcaseIcon, BuildingsIcon, GraduationCapIcon, StorefrontIcon } from '@phosphor-icons/react/ssr';
import { AccountRole } from '@/enums';
import styles from './adsAccessLanding.module.css';

const advertiserPaths = [
  { title: 'Students', description: 'Share a skill, service, or job opportunity with the campus community.', detail: 'Skills · services · jobs', href: '/onboarding/student', icon: GraduationCapIcon },
  { title: 'Local businesses', description: 'Introduce a useful local service and manage its campaign in Uley.', detail: 'Register · create · measure', href: '/onboarding/business', icon: StorefrontIcon },
  { title: 'Landlords', description: 'Promote a verified home from your property workspace.', detail: 'Verified property promotion', href: '/onboarding/landlord', icon: BuildingsIcon },
];

export function AdsAccessLanding({ role }: { role: AccountRole | null }) {
  const landlord = role === AccountRole.LANDLORD;
  const administrator = role === AccountRole.SCHOOL_ADMIN || role === AccountRole.SUPER_ADMIN || role === AccountRole.VERIFICATION_ADMIN || role === AccountRole.SAFETY_ADMIN || role === AccountRole.INSPECTION_ADMIN || role === AccountRole.ACCOUNT_ADMIN;

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.intro}><p className={styles.kicker}><BriefcaseIcon size={16} weight="fill" /> ULEY · COMMUNITY CAMPAIGNS</p>
        <h1>{landlord ? <>Give a verified home<br /><em>more visibility.</em></> : <>Good work deserves<br /><em>to be seen.</em></>}</h1>
        <p className={styles.lede}>{landlord ? 'Promote an approved property to students looking for a place near campus. Set up and manage your campaign from the landlord workspace.' : 'Create a useful ad for the Uley community. Students can share skills and jobs, while registered local businesses can promote services near campus.'}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={landlord ? '/landlord/ads' : administrator ? '/admin/ads' : '/onboarding'}>{landlord ? 'Open property promotion' : administrator ? 'Review community ads' : 'Choose your account'}<ArrowUpRightIcon size={17} weight="bold" /></Link>
          {!role && <Link className={styles.signIn} href="/login">Already registered? Sign in</Link>}
        </div>
      </div>
      <CampaignIllustration />
    </section>
    {!role && <section className={styles.paths} aria-labelledby="advertiser-paths-heading">
      <div className={styles.sectionHeading}><p>ONE PLACE TO GET STARTED</p><h2 id="advertiser-paths-heading">Choose the way you’ll advertise.</h2></div>
      <div className={styles.pathGrid}>{advertiserPaths.map(({ title, description, detail, href, icon: Icon }) => <Link className={styles.pathCard} href={href} key={title}>
        <span className={styles.pathIcon}><Icon size={23} weight="duotone" /></span><span className={styles.pathDetail}>{detail}</span><strong>{title}</strong><span className={styles.pathDescription}>{description}</span><span className={styles.pathCta}>Register and continue <ArrowUpRightIcon size={15} /></span>
      </Link>)}</div>
      <p className={styles.paymentNote}>Every campaign is reviewed before it can run. Approved community ads are paid through Bachs; landlord home promotion is managed in the property workspace.</p>
    </section>}
  </main>;
}

function CampaignIllustration() {
  return <figure className={styles.art} aria-label="Illustration of a student service campaign on a campus community board">
    <svg viewBox="0 0 520 390" role="img" aria-labelledby="campaign-art-title"><title id="campaign-art-title">A campus community board with a student photography ad</title>
      <rect x="5" y="5" width="510" height="380" rx="9" fill="var(--color-illustration-board)" /><circle cx="430" cy="70" r="28" fill="var(--color-citrus)" />
      <path d="M5 295q70-30 145-2t140 0 225-7v99H5z" fill="var(--color-illustration-ground)" />
      <path d="M46 256V147l74-55 75 55v109z" fill="var(--color-illustration-cream)" stroke="var(--color-primary-action)" strokeWidth="4"/><path d="M72 163h28v28H72zm67 0h28v28h-28z" fill="var(--color-illustration-window)"/><path d="M105 205h31v51h-31z" fill="var(--color-illustration-terracotta)"/>
      <rect x="214" y="69" width="252" height="246" rx="8" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="3"/><path d="M214 77q0-8 8-8h236q8 0 8 8v34H214z" fill="var(--color-ink)"/><circle cx="233" cy="89" r="5" fill="var(--color-citrus)"/><path d="M249 87h86m-86 7h60" stroke="var(--color-surface)" strokeWidth="4" strokeLinecap="round"/>
      <rect x="232" y="130" width="216" height="164" rx="5" fill="var(--color-paper)" stroke="var(--color-line)" strokeWidth="2"/><rect x="245" y="143" width="190" height="77" fill="var(--color-primary-soft)"/><circle cx="337" cy="177" r="23" fill="var(--color-illustration-terracotta)"/><path d="M308 207q29-34 58 0" fill="var(--color-primary-action)"/><path d="M250 237h126m-126 13h91" stroke="var(--color-muted-ink)" strokeWidth="6" strokeLinecap="round"/><rect x="250" y="266" width="90" height="17" rx="8" fill="var(--color-primary-action)"/><path d="m417 254 7 7 14-17" fill="none" stroke="var(--color-trust-green)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M176 302q27-40 55-7m-28 12 15-46" fill="none" stroke="var(--color-illustration-route)" strokeWidth="5" strokeDasharray="4 8"/><circle cx="176" cy="302" r="10" fill="var(--color-citrus)"/>
    </svg>
    <figcaption>A campaign card, ready to be reviewed before it appears.</figcaption>
  </figure>;
}
