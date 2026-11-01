import Link from 'next/link';
import { ArrowRightIcon, CheckCircleIcon, ClockCountdownIcon } from '@phosphor-icons/react/ssr';
import styles from './platformTransparency.module.css';

const liveFeatures = [
  'Landlord and property review before public listing',
  'Yearly, monthly, weekly, daily, and nightly prices',
  'Inspection scheduling, student rescheduling, and post-visit outcomes',
  'Scheduled in-app reminders in the notification feed (no push/email delivery)',
  'Landlord-confirmed move-in and payment records with moderated occupancy reviews',
  'Landlord controls for pausing or reopening available units',
  'Private landlord, school support, and flatmate conversations with reports, blocks, and moderation',
  'Occupancy-based housing complaints with landlord-first handling, urgent school escalation, and student-confirmed closure',
  'School-reviewed, clearly labeled Sponsored placements with coarse city or university targeting and view/click totals',
  'Nearby search with one-time location permission',
  'Resumable chunked photo upload with file-safety scanning',
  'Listing reports and role-limited school administration',
];

const inProgressFeatures = ['Video evidence uploads'];

export function PlatformTransparencySection() {
  return <section className={styles.section} aria-labelledby="transparency-heading">
    <div className="page-container">
      <div className={styles.heading}><p className="eyebrow eyebrow--blue">BUILT IN THE OPEN</p><h2 id="transparency-heading">Know what you can use today.</h2><p>Uley is growing in stages. We separate working tools from features still being built so you can make decisions with the right expectations.</p></div>
      <div className={styles.columns}>
        <article className={styles.column}><h3><CheckCircleIcon size={21} weight="duotone" /> Available in the pilot</h3><ul>{liveFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>
        <article className={[styles.column, styles.next].join(' ')}><h3><ClockCountdownIcon size={21} weight="duotone" /> In development</h3><ul>{inProgressFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>
      </div>
      <Link className={styles.link} href="/how-it-works">See the full journey and how data moves <ArrowRightIcon size={16} weight="bold" /></Link>
    </div>
  </section>;
}
