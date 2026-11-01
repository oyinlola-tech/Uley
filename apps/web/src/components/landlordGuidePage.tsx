import Link from 'next/link';
import { ArrowRightIcon, ClipboardTextIcon, HouseLineIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { PUBLIC_ROUTES } from '../constants';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './productGuidePages.module.css';
import { ProductIllustration } from './productIllustration';

const landlordSteps = [
  { number: '01', icon: SealCheckIcon, title: 'Create your landlord account', description: 'Register with your own account details so school reviewers know who is responsible for the listing.' },
  { number: '02', icon: ClipboardTextIcon, title: 'Request school verification', description: 'Submit a review request and follow the school’s existing process for presenting identity and ownership or management evidence.' },
  { number: '03', icon: HouseLineIcon, title: 'Prepare a clear property listing', description: 'After approval, add the address, neighborhood, description, and an available unit with its rent and room details.' },
  { number: '04', icon: SealCheckIcon, title: 'Wait for the property decision', description: 'The school reviews the property separately. Approved properties become visible to students; rejected submissions include a reason.' },
];

export function LandlordGuidePage() {
  return <ProductGuideFrame><main className={styles.page}>
    <section className={`${styles.hero} ${styles.landlordHero}`}><div><p className={styles.eyebrow}>FOR LANDLORDS · LIST WITH CLARITY</p><h1>Give students the details they need to <em>choose well.</em></h1><p className={styles.lead}>Uley gives property owners a clear route to request school review and present available accommodation to students.</p><Link className={styles.primaryLink} href={PUBLIC_ROUTES.landlordRegistration}>Create a landlord account <ArrowRightIcon size={17} weight="bold" /></Link></div><ProductIllustration scene="listingSetup" /></section>
    <section className={styles.steps} aria-labelledby="landlord-steps-heading"><div className={styles.sectionHeading}><p className={styles.eyebrow}>HOW TO GET STARTED</p><h2 id="landlord-steps-heading">A separate review for you and your property.</h2></div><div className={styles.stepGrid}>{landlordSteps.map(({ number, icon: StepIcon, title, description }) => <article className={styles.stepCard} key={number}><div className={styles.stepTop}><span>{number}</span><StepIcon size={25} weight="duotone" /></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <aside className={`${styles.note} ${styles.limitNote}`}><div><p className={styles.eyebrow}>KEEP IT STRAIGHTFORWARD</p><h2>Your property is not public until both reviews are approved.</h2></div><p>Landlord verification and property verification are separate decisions. Identity documents are handled through the school’s verification process; Uley does not currently accept document uploads.</p></aside>
    <section className={styles.nextStep}><p className={styles.eyebrow}>START YOUR REVIEW</p><h2>Set up your account and request verification.</h2><Link className={styles.primaryLink} href={PUBLIC_ROUTES.landlordRegistration}>Create a landlord account <ArrowRightIcon size={17} weight="bold" /></Link></section>
  </main></ProductGuideFrame>;
}
