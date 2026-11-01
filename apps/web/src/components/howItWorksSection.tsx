import { ArrowRightIcon, BuildingsIcon, ClipboardTextIcon, FootprintsIcon, ShieldCheckIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import styles from './callToActions.module.css';
import { PUBLIC_ROUTES } from '../constants';

const accommodationSteps = [
  {
    number: '01',
    icon: BuildingsIcon,
    title: 'Find a home',
    description: 'Search published properties and compare the details that matter to you.',
  },
  {
    number: '02',
    icon: FootprintsIcon,
    title: 'See it for yourself',
    description: 'Request an inspection before you send an application.',
  },
  {
    number: '03',
    icon: ClipboardTextIcon,
    title: 'Decide at your pace',
    description: 'Inspect the home, ask about every charge, and make your decision directly with the landlord.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="journey-section" id="how-it-works" aria-labelledby="journey-heading">
      <div className="page-container">
        <div className="section-intro section-intro--centered">
          <p className="eyebrow eyebrow--blue">From search to move-in</p>
          <h2 id="journey-heading">A clearer route to your next room.</h2>
          <p className="section-intro__body">Take the steps in your own time. You choose when a place feels right.</p>
        </div>
        <div className="journey-grid">
          {accommodationSteps.map(({ number, icon: StepIcon, title, description }, stepIndex) => (
            <article className="journey-step" key={number}>
              <div className="journey-step__topline">
                <span className="journey-step__number">{number}</span>
                {stepIndex < accommodationSteps.length - 1 && <span className="journey-step__connector" aria-hidden="true" />}
                <div className="journey-step__icon"><StepIcon size={22} weight="duotone" aria-hidden="true" /></div>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <p className="journey-footnote"><ArrowRightIcon size={15} weight="bold" aria-hidden="true" /> Report a misleading published listing for school review.</p>
        <aside className={styles.journeyCallout} aria-labelledby="journey-callout-heading">
          <div className={styles.journeyCalloutMark}><ShieldCheckIcon size={22} weight="duotone" aria-hidden="true" /></div>
          <div className={styles.journeyCalloutCopy}>
            <h3 id="journey-callout-heading">Before you decide, know what has been checked.</h3>
            <p>See the landlord and property reviews that happen before a home is published.</p>
          </div>
          <Link className={styles.journeyCalloutLink} href={PUBLIC_ROUTES.whatWeCheck}>
            See the checks <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
