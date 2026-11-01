import Link from 'next/link';
import { ArrowRightIcon, SealCheckIcon, CheckIcon, ClipboardTextIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import styles from './callToActions.module.css';
import { PUBLIC_ROUTES } from '../constants';
import { ProductIllustration } from './productIllustration';
import { HomeEntrance } from './homeEntrance';

export function HeroSection() {
  return (
    <section className="hero-section page-container" aria-labelledby="hero-heading">
      <HomeEntrance className="hero-copy">
        <p className="hero-index">A HOUSING FIELD GUIDE <span>·</span> FOR STUDENTS & FAMILIES</p>
        <p className="eyebrow"><span className="eyebrow__dot" /> A clearer way to find a home off campus</p>
        <h1 id="hero-heading">Find a place near campus. <span>Leave less to guess.</span></h1>
        <p className="hero-description">
          Compare reviewed homes, arrange a visit before applying, and know where to turn if something needs attention.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.heroPrimary} href="/listings">
            Browse homes <ArrowRightIcon size={18} weight="bold" aria-hidden="true" />
          </Link>
          <Link className={styles.heroSecondary} href={PUBLIC_ROUTES.studentGuide}>How the search works <ArrowRightIcon size={14} aria-hidden="true" /></Link>
        </div>
        <div className="hero-note">
          <MagnifyingGlassIcon size={19} weight="duotone" aria-hidden="true" />
          <span>Compare first. Visit before you decide.</span>
        </div>
      </HomeEntrance>

      <HomeEntrance className="hero-visual" delay={0.12}>
        <div className="hero-visual-note"><span>01 / FIND YOUR BEARINGS</span><span>STUDENT HOUSING · NIGERIA</span></div>
        <div className="hero-image-frame"><ProductIllustration scene="discovery" /></div>

        <aside className="verification-receipt" aria-label="Uley verification steps">
          <div className="receipt-heading">
            <div className="receipt-icon"><ClipboardTextIcon size={19} weight="duotone" aria-hidden="true" /></div>
            <div>
              <p className="receipt-kicker">Before it goes public</p>
              <p className="receipt-title">A few things are checked first</p>
            </div>
            <SealCheckIcon className="receipt-badge" size={21} weight="duotone" aria-hidden="true" />
          </div>
          <ul className="receipt-list">
            <li><span><CheckIcon size={12} weight="bold" aria-hidden="true" /></span> Landlord identity reviewed</li>
            <li><span><CheckIcon size={12} weight="bold" aria-hidden="true" /></span> Property details checked</li>
            <li><span className="receipt-list__step">→</span> Inspect before you apply</li>
          </ul>
        </aside>
        <span className="hero-citrus-mark" aria-hidden="true" />
      </HomeEntrance>
    </section>
  );
}
