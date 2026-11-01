import Link from 'next/link';
import { ArrowRightIcon, BuildingsIcon, ClipboardTextIcon, EyeIcon, MapPinLineIcon } from '@phosphor-icons/react/ssr';
import { PUBLIC_ROUTES } from '../constants';
import { ProductGuideFrame } from './productGuideFrame';
import styles from './productGuidePages.module.css';
import { ProductIllustration } from './productIllustration';

const studentSteps = [
  { number: '01', icon: MapPinLineIcon, title: 'Start with your daily route', description: 'Choose the campus, neighborhood, and transport options that fit your routine. Check how far the home is from the places you visit most.' },
  { number: '02', icon: BuildingsIcon, title: 'Compare the full cost', description: 'Look at the rent and the room details together. Ask what is included, when payment is due, and whether any additional charges apply.' },
  { number: '03', icon: EyeIcon, title: 'See the place in person', description: 'Arrange an inspection before applying. Check the room, shared spaces, water, power, access, and the route home.' },
  { number: '04', icon: ClipboardTextIcon, title: 'Keep your decision clear', description: 'Confirm who manages the property, read the agreement, and keep copies of your application and important conversations.' },
];

export function StudentGuidePage() {
  return <ProductGuideFrame><main className={styles.page}>
    <section className={`${styles.hero} ${styles.studentHero}`}><div><p className={styles.eyebrow}>THE STUDENT GUIDE · FIND YOUR BEARINGS</p><h1>A better search starts with <em>better questions.</em></h1><p className={styles.lead}>Use this guide to compare off-campus options, plan a useful inspection, and understand the next steps before you commit.</p><Link className={styles.primaryLink} href={PUBLIC_ROUTES.browseHomes}>Browse homes <ArrowRightIcon size={17} weight="bold" /></Link></div><ProductIllustration scene="inspection" /></section>
    <section className={styles.steps} aria-labelledby="student-steps-heading"><div className={styles.sectionHeading}><p className={styles.eyebrow}>A PRACTICAL ROUTE</p><h2 id="student-steps-heading">From first search to confident decision.</h2></div><div className={styles.stepGrid}>{studentSteps.map(({ number, icon: StepIcon, title, description }) => <article className={styles.stepCard} key={number}><div className={styles.stepTop}><span>{number}</span><StepIcon size={25} weight="duotone" /></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <aside className={styles.note}><div><p className={styles.eyebrow}>BEFORE YOU PAY</p><h2>Verify the terms and the person receiving your money.</h2></div><p>Do not rely on a listing alone to confirm safety or property condition. Inspect the home, ask for written terms, and keep a record of any payment and agreement.</p></aside>
    <section className={styles.nextStep}><p className={styles.eyebrow}>READY TO LOOK?</p><h2>Start with homes reviewed for publication.</h2><Link className={styles.primaryLink} href={PUBLIC_ROUTES.browseHomes}>Browse available homes <ArrowRightIcon size={17} weight="bold" /></Link><Link className={styles.secondaryLink} href={PUBLIC_ROUTES.whatWeCheck}>See what Uley checks <ArrowRightIcon size={15} /></Link></section>
  </main></ProductGuideFrame>;
}
