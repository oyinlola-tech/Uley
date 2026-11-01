import Link from 'next/link';
import { ArrowRightIcon, ClipboardTextIcon, HouseLineIcon, SealCheckIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr';
import { PUBLIC_ROUTES } from '../constants';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './productGuidePages.module.css';
import { ProductIllustration } from './productIllustration';

const reviewStages = [
  { number: '01', icon: SealCheckIcon, title: 'Landlord review', description: 'A landlord requests verification. The school reviews the account through its verification process before the landlord can submit homes for publication.' },
  { number: '02', icon: HouseLineIcon, title: 'Property review', description: 'The landlord submits property details and an available unit. The school reviews the submission and records its decision.' },
  { number: '03', icon: ClipboardTextIcon, title: 'Publication decision', description: 'Only an approved property linked to an approved landlord can appear in public search. Rejections include a reason for follow-up.' },
];

export function VerificationGuidePage() {
  return <ProductGuideFrame><main className={styles.page}>
    <section className={`${styles.hero} ${styles.checkHero}`}><div><p className={styles.eyebrow}>WHAT WE CHECK · A CLEARER RECORD</p><h1>Trust should come with <em>a process you can see.</em></h1><p className={styles.lead}>Uley adds a school review layer to landlord accounts and property listings before homes become publicly visible.</p><Link className={styles.primaryLink} href={PUBLIC_ROUTES.browseHomes}>Browse reviewed homes <ArrowRightIcon size={17} weight="bold" /></Link></div><ProductIllustration scene="verification" /></section>
    <section className={styles.steps} aria-labelledby="review-stages-heading"><div className={styles.sectionHeading}><p className={styles.eyebrow}>THE REVIEW PATH</p><h2 id="review-stages-heading">Two reviews before a home is listed.</h2></div><div className={styles.stepGrid}>{reviewStages.map(({ number, icon: StageIcon, title, description }) => <article className={styles.stepCard} key={number}><div className={styles.stepTop}><span>{number}</span><StageIcon size={25} weight="duotone" /></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <aside className={`${styles.note} ${styles.limitNote}`}><div><WarningCircleIcon size={27} weight="duotone" /><p className={styles.eyebrow}>A NOTE ON VERIFICATION</p><h2>Review is a useful signal, not a guarantee.</h2></div><p>Verification does not replace an in-person inspection, your own checks, or a written rental agreement. Confirm the home’s condition and terms before deciding.</p></aside>
    <section className={styles.nextStep}><p className={styles.eyebrow}>LOOK FOR YOURSELF</p><h2>Compare the information available on each listing.</h2><Link className={styles.primaryLink} href={PUBLIC_ROUTES.browseHomes}>Browse homes <ArrowRightIcon size={17} weight="bold" /></Link></section>
  </main></ProductGuideFrame>;
}
