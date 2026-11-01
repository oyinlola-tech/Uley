import Link from 'next/link';
import { ArrowRightIcon, HouseLineIcon } from '@phosphor-icons/react/ssr';
import styles from './callToActions.module.css';
import { ProductIllustration } from './productIllustration';

export function ForLandlordsSection() {
  return (
    <section className="landlord-section page-container" id="landlords" aria-labelledby="landlord-heading">
      <div className="landlord-panel">
        <div className="landlord-panel__copy">
          <p className="eyebrow eyebrow--light"><HouseLineIcon size={16} weight="duotone" aria-hidden="true" /> A clear route for property owners</p>
          <h2 id="landlord-heading">Introduce your property with the details students need.</h2>
          <p>Share the essentials, make inspections possible, and help students decide with a clearer picture.</p>
            <Link className={styles.landlordAction} href="/onboarding/landlord">
            Create a landlord account <ArrowRightIcon size={17} weight="bold" aria-hidden="true" />
          </Link>
        </div>
        <div className="landlord-panel__art"><ProductIllustration scene="landlord" /></div>
      </div>
    </section>
  );
}
