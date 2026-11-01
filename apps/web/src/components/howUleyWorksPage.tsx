import Link from 'next/link';
import { ArrowRightIcon, BuildingsIcon, ClipboardTextIcon, EyeIcon, ShieldCheckIcon } from '@phosphor-icons/react/ssr';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './policyPage.module.css';

const availableToday = [
  ['Verified listings', 'Landlords submit an account and property for review. Approved properties from approved landlords can be published.'],
  ['Compare before you visit', 'Public listing results show available unit pricing and rental periods, including yearly rent, deposits, service charges, and inspection fees.'],
  ['Inspection requests and visit updates', 'Landlords can confirm or decline visits. Students can request a new time, mark a past confirmed visit missed, and submit a post-visit outcome. Reminders appear in the in-app feed; optional mobile push depends on deployment setup.'],
  ['Move-in and home reviews', 'Students can report that they secured a home. The landlord confirms the move-in and may separately confirm payment. Only occupancy-backed reviews with landlord-confirmed payment can be submitted; school moderation is required before public display. Uley does not process or independently verify payments.'],
  ['Unit availability', 'Landlords can pause or reopen a unit. A unit with an active occupancy cannot be reopened as available.'],
  ['Messaging and flatmates', 'Signed-in students and landlords can message within property conversations. Students can open a school-support thread and publish flatmate search posts. Messages can be reported or blocked; possible offensive language is held for school review. If a moderator rejects a message, its sender can submit one appeal for independent safety review. Overturned appeals deliver the message; upheld decisions include an explanation. Conversation messages arrive over an authenticated live connection, with automatic reconnect and a slower history refresh when the connection is unavailable.'],
  ['Sponsored home placements', 'Landlords preview the sponsored card, submit it for school review, then pay securely through Bachs. Approved, verified and paid campaigns run with a clear Sponsored label and a single placement per result page. Up to ten approved campaigns can be paid in one checkout. Targeting is limited to city or university; Uley records view and click totals.'],
  ['Location with control', 'Nearby search asks for device location when started. Exact property coordinates are not included in public listing responses. Inspection sharing is opt-in and can be stopped.'],
  ['Safety reporting', 'Signed-in users can report a published listing. School staff can review these reports and verified property submissions.'],
  ['Housing complaints', 'Students with an active confirmed occupancy can report an issue to the landlord and any caretaker explicitly assigned to that property, follow status and messages, attach private MP4 evidence, and confirm whether a proposed fix worked. Evidence is checked in the background and only shared after it passes. Urgent issues go directly to school support; students can escalate unresolved reports. A complaint cannot be closed by the landlord alone.'],
  ['Admin accountability', 'Administrative changes and selected failed requests are logged for super-admin review. Logs avoid request bodies, passwords, and tokens.'],
];

const plannedFeatures = ['Rental applications and tenancy documents'];

export function HowUleyWorksPage() {
  return <ProductGuideFrame><main className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>A PRACTICAL GUIDE TO THE PILOT</p>
      <h1>How Uley works, and what happens to your data.</h1>
      <p className={styles.lead}>Uley is an independent off-campus housing platform. It helps students compare listings and request visits; it is not a school-owned hostel system, landlord, payment processor, or a guarantee that a property is safe.</p>
      <p className={styles.updated}>Current pilot capabilities · Updated 31 October 2026</p>
      <div className={styles.actions}><Link href="/listings">Browse homes <ArrowRightIcon size={16} /></Link><Link href="/privacy">Read the privacy notice <ArrowRightIcon size={16} /></Link></div>
    </header>
    <section className={styles.section} aria-labelledby="journey-heading">
      <h2 id="journey-heading">The student journey</h2>
      <div className={styles.grid}>
        <article className={styles.card}><BuildingsIcon size={24} /><h3>1. Search and compare</h3><p>Browse published properties, compare unit prices and rental periods, and use nearby search if you choose to share your device location.</p></article>
        <article className={styles.card}><ShieldCheckIcon size={24} /><h3>2. Check what Uley reviewed</h3><p>Landlord and property verification are separate review steps. A platform check is not a substitute for inspecting the home, confirming ownership, or reading a rental agreement.</p></article>
        <article className={styles.card}><EyeIcon size={24} /><h3>3. Request a visit</h3><p>Choose a unit and request an inspection time. The landlord can confirm or decline it; you can ask for a new time and receive in-app reminders after confirmation.</p></article>
        <article className={styles.card}><ClipboardTextIcon size={24} /><h3>4. Record the outcome</h3><p>After a confirmed visit, share whether you are interested or secured the home. A landlord-confirmed move-in and payment record can qualify you to submit a moderated verified review. Uley does not collect rent or independently verify payments.</p></article>
      </div>
    </section>
    <section className={styles.section}><h2>What works today</h2><ul>{availableToday.map(([title, detail]) => <li key={title}><strong>{title}:</strong> {detail}</li>)}</ul></section>
    <section className={styles.section}><h2>What is still being built</h2><p>These are planned features, not available services. We will update this page when a feature is released.</p><ul>{plannedFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>
    <section className={styles.section}><h2>How data moves through Uley</h2>
      <ol><li>You provide account details, university selection, listing information, inspection requests, feedback, occupancy reports, complaints, reviews, listing reports, flatmate details, ads, and private messages through the web or mobile app.</li><li>The API checks account role and permissions, validates each action, and stores its records in PostgreSQL. Scheduled inspection reminders become visible in the in-app notification feed when due; the feed refreshes while the inspection workspace is open.</li><li>Property photos are uploaded in chunks. Ad images are limited to one image per campaign. Both go through the private Python media service for file type, size, image dimensions, malware scanning, and metadata removal. School moderators review ad image content before an ad can be approved. The pilot uses local persistent storage; S3-compatible storage is configurable.</li><li>Public listing summaries include only approved review ratings and counts. Exact property coordinates are omitted; inspection location is shared only after a participant opts in. Message text is visible to its conversation participants and authorized safety moderators. Complaint details are visible to the student, responsible landlord, assigned property caretakers, and authorized school reviewers for urgent or escalated cases. Caretaker access is limited to assigned properties and ends when the landlord removes the assignment.</li><li>Authorized school staff review verification, listing reports, submitted home reviews, flagged messages, reports about ads or other content, and urgent or escalated housing complaints. Complaint status changes are recorded in admin logs.</li></ol>
      <p>Messages are checked server-side for a limited list of potentially offensive terms. Matches are held from recipients for human review; this check cannot identify every harmful message or interpret context perfectly. A sender can appeal one moderator rejection and receives the final decision with an explanation. Inbox updates use authenticated live connections with automatic reconnect and a slower history refresh if the connection is unavailable. Mobile push depends on the operator configuring the Expo project and registering a device.</p>
      <p>Browser drafts and upload-resume details can be stored on the device. The browser refresh token is held in an HTTP-only cookie. Mobile refresh tokens are kept in the platform secure store.</p>
    </section>
    <section className={styles.section}><h2>Location is optional</h2><p>Nearby search uses your location only after you start the feature and grant device permission. Inspection sharing is a separate action for confirmed visits; you can stop it. The API stores the most recent shared point, and old points are treated as expired after two minutes.</p></section>
    <section className={styles.section}><h2>Questions and corrections</h2><p>Read the <Link href="/privacy">privacy notice</Link> and <Link href="/cookies">cookie details</Link>. Before public launch, Uley must publish its legal operator name, privacy contact, retention schedule, and current hosting/provider list.</p></section>
  </main></ProductGuideFrame>;
}
