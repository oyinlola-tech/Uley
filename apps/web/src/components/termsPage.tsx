import type { Metadata } from 'next';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './policyPage.module.css';

export const termsMetadata: Metadata = {
  title: 'Terms of use | Uley',
  description: 'Terms for using Uley’s student accommodation discovery and verification platform.',
};

export function TermsPage() {
  return <ProductGuideFrame><main className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>PLATFORM TERMS</p>
      <h1>Use Uley with care and clear expectations.</h1>
      <p className={styles.lead}>These pilot terms explain what Uley does, what users are responsible for, and what the current software does not provide.</p>
      <p className={styles.updated}>Updated 31 October 2026 · Operator identity and governing-law details require completion before launch.</p>
    </header>
    <section className={styles.section}><h2>What Uley provides</h2><p>Uley is a platform for finding off-campus housing, comparing published listing details, requesting and rescheduling inspections, receiving in-app visit reminders, reporting visit outcomes, messaging landlords and school support, and posting flatmate searches. Users can report or block conversation participants. A limited server-side language check holds selected messages for school review. Eligible occupancies can submit a home review for school moderation. Verification means information was reviewed under the platform’s process; it is not a guarantee of ownership, habitability, legal compliance, safety, price accuracy, or future conduct.</p></section>
    <section className={styles.section}><h2>What Uley does not provide</h2><p>Uley is not a landlord, real-estate agent, school hostel operator, payment processor, escrow service, or party to a rental agreement. The platform does not process rent or deposits or independently verify payments. A landlord may record that they confirmed a payment; this is a user-submitted record, not a guarantee. Uley does not guarantee an inspection appointment or delivery of a reminder; mobile push depends on a configured app build, device registration, and notification permission. Users must independently inspect a property, confirm who is entitled to rent it, check every charge, and use safe payment practices.</p></section>
    <section className={styles.section}><h2>Your account and submissions</h2><ul><li>Give accurate account and listing information and keep your sign-in details private.</li><li>Only upload photos and information you have the right to share. Do not upload another person’s identity documents or private data without a lawful reason.</li><li>Do not impersonate another person, evade verification, mislead students about a property, or misuse location features.</li><li>Do not threaten, harass, discriminate against, or publish private information about another user.</li><li>Report suspicious or misleading listings through the available reporting feature.</li></ul></section>
    <section className={styles.section}><h2>School review and moderation</h2><p>School staff may review landlord and property verification submissions, listing reports, reported conversations, messages held by the limited text check, submitted home reviews, and administrative records within their assigned access. The message check can miss harmful content and can flag harmless context. A moderator may approve or reject held messages, remove reported posts, or dismiss a report. A sender may appeal a rejected chat message once. An authorized safety moderator reviews the appeal and records a decision note; an overturned message is delivered, while an upheld message remains undelivered. Active residents can also use the housing complaint workflow to report issues. A landlord may assign a registered caretaker to specific properties; that caretaker can view and respond only to issues for assigned properties. Unresolved or urgent cases can be escalated to the school.</p></section>
    <section className={styles.section}><h2>Availability and changes</h2><p>The platform is a pilot and some functions are still being built. Current features and planned features are identified in <a href="/how-it-works">How Uley works</a>. Uley may update the service, suspend access for safety or security reasons, or remove inaccurate or harmful content. Statutory consumer and data rights are not limited by these terms.</p></section>
    <section className={styles.section}><h2>Operator details</h2><p>The legal operator name, service address, governing-law wording, support contact, and formal complaints process must be supplied before these terms are used as a binding production contract.</p></section>
  </main></ProductGuideFrame>;
}
