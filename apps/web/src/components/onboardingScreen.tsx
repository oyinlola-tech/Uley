import { WEB_API_BASE_PATH } from '../constants';
import Link from 'next/link';
import { ArrowLeftIcon, CheckIcon, HouseLineIcon, StudentIcon, StorefrontIcon, UserGearIcon } from '@phosphor-icons/react/ssr';
import { AccountForm } from './accountForm';
import { UleyLogo } from './uleyLogo';
import { ThemeToggle } from './themeToggle';
import styles from './onboardingPage.module.css';
import { ProductIllustration } from './productIllustration';

import { AuthFormMode } from '../enums';

type OnboardingScreenProps = { mode: AuthFormMode; nextPath?: string };

const screenContent = {
  [AuthFormMode.STUDENT]: { eyebrow: 'STUDENT ACCOUNT SETUP', title: <>A clearer start to<br /><span>finding your place.</span></>, description: 'Create your account to save places, arrange inspections, and keep your housing conversations in one place.', label: 'Create your student account', button: 'Create student account' },
  [AuthFormMode.LANDLORD]: { eyebrow: 'LANDLORD ACCOUNT SETUP', title: <>List with clarity.<br /><span>Build confidence.</span></>, description: 'Create a landlord account, then prepare your identity and property details for Uley review before publishing.', label: 'Create your landlord account', button: 'Create landlord account' },
  [AuthFormMode.BUSINESS]: { eyebrow: 'BUSINESS ADVERTISER SETUP', title: <>Bring your work<br /><span>to the campus community.</span></>, description: 'Register your local business to create service ads, set a budget, preview campaigns, and track results inside Uley.', label: 'Create a business advertiser account', button: 'Create business account' },
  [AuthFormMode.CARETAKER]: { eyebrow: 'PROPERTY CARETAKER SETUP', title: <>Help residents<br /><span>feel looked after.</span></>, description: 'Create a caretaker account. A landlord must assign you to each property before you can see resident housing issues.', label: 'Create your caretaker account', button: 'Create caretaker account' },
  [AuthFormMode.LOGIN]: { eyebrow: 'WELCOME BACK', title: <>Pick up where<br /><span>you left off.</span></>, description: 'Sign in to continue with your Uley account and housing journey.', label: 'Sign in to Uley', button: 'Sign in' },
} as const;

export function OnboardingScreen({ mode, nextPath }: OnboardingScreenProps) {
  if (mode === AuthFormMode.CHOOSE) return <RoleSelectionScreen />;
  const content = screenContent[mode];
  return (
    <main className={styles.page}>
      <header className={styles.topbar}><UleyLogo href="/" /><div className={styles.topbarActions}><ThemeToggle /><Link href={mode === AuthFormMode.LOGIN ? '/' : '/onboarding'}><ArrowLeftIcon size={14} /> {mode === AuthFormMode.LOGIN ? 'Back to Uley' : 'Choose account type'}</Link></div></header>
      <div className={styles.layout}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}><span className="eyebrow__dot" /> {content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className={styles.introCopy}>{content.description}</p>
          <ul className={styles.trustNotes}>
            {(mode === AuthFormMode.LOGIN
              ? ['Use the email and password you registered with', 'Your account type was set during registration', 'Property verification is tracked separately']
            : mode === AuthFormMode.STUDENT
                ? ['Keep your search and housing requests together', 'Request an inspection before applying', 'You decide whether a place is right for you']
                : mode === AuthFormMode.CARETAKER
                  ? ['A landlord must assign you to a property', 'You can respond to housing issues for assigned homes', 'You will not see other properties or resident records']
                  : mode === AuthFormMode.BUSINESS
                  ? ['Business details are reviewed before ads can run', 'Campaigns are created and managed inside Uley', 'Payment is required before an approved campaign starts']
                  : ['Your account is reviewed before you publish', 'Property details are checked separately', 'Students can request an inspection before applying']
            ).map((note) => <li key={note}><CheckIcon size={16} weight="bold" /> {note}</li>)}
          </ul>
          <p className={styles.sideNote}><strong>{mode === AuthFormMode.CARETAKER ? 'Assigned access only' : mode === AuthFormMode.BUSINESS ? 'Review comes first' : mode === AuthFormMode.LANDLORD ? 'Verification comes first' : 'A note on verification'}</strong>{mode === AuthFormMode.CARETAKER ? 'Your account only receives access after a landlord assigns you to a specific property. That landlord can remove the assignment.' : mode === AuthFormMode.BUSINESS ? 'Business registration lets you prepare campaigns. Uley reviews business information and each ad before it can be shown.' : mode === AuthFormMode.LANDLORD ? 'An account alone does not approve a landlord or property. Uley reviews both before a property can be published.' : 'Creating an account does not mean a landlord or property has been verified. Uley reviews those details separately.'}</p>
          <div className={styles.authIllustration}><ProductIllustration scene={mode === AuthFormMode.LANDLORD ? 'listingSetup' : 'accountSetup'} /></div>
        </section>
        <AccountForm mode={mode} content={content} apiBaseUrl={WEB_API_BASE_PATH} nextPath={nextPath} />
      </div>
    </main>
  );
}

function RoleSelectionScreen() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}><UleyLogo href="/" /><div className={styles.topbarActions}><ThemeToggle /><p>Housing, with more clarity</p></div></header>
      <div className={styles.layout}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}><span className="eyebrow__dot" /> A GOOD PLACE TO BEGIN</p>
          <h1>First, tell us<br /><span>what brings you here.</span></h1>
          <p className={styles.introCopy}>Uley helps students find off-campus accommodation and gives landlords a clearer way to present their properties.</p>
          <p className={styles.sideNote}><strong>Not a school hostel system</strong>Uley supports independent off-campus housing, with an accountability path for accommodation concerns.</p>
        </section>
        <section className={styles.card} aria-labelledby="role-title">
          <div className={styles.cardHeading}><p>Choose your path</p><h2 id="role-title">I’m here as a…</h2></div>
          <div className={styles.roleOptions}>
            <Link className={styles.roleCard} href="/onboarding/student"><span className={styles.roleIcon}><StudentIcon size={23} weight="duotone" /></span><span><strong>Student</strong><small>Find a home, request an inspection, and apply with more confidence.</small></span><ArrowLeftIcon size={19} className={styles.forwardArrow} aria-hidden="true" /></Link>
            <Link className={styles.roleCard} href="/onboarding/landlord"><span className={styles.roleIcon}><HouseLineIcon size={23} weight="duotone" /></span><span><strong>Landlord</strong><small>Verify your account and prepare a property listing for review.</small></span><ArrowLeftIcon size={19} className={styles.forwardArrow} aria-hidden="true" /></Link>
            <Link className={styles.roleCard} href="/onboarding/business"><span className={styles.roleIcon}><StorefrontIcon size={23} weight="duotone" /></span><span><strong>Local business</strong><small>Register your business and create paid campaigns for the Uley community.</small></span><ArrowLeftIcon size={19} className={styles.forwardArrow} aria-hidden="true" /></Link>
            <Link className={styles.roleCard} href="/onboarding/caretaker"><span className={styles.roleIcon}><UserGearIcon size={23} weight="duotone" /></span><span><strong>Property caretaker</strong><small>Respond to resident issues after a landlord assigns you to a home.</small></span><ArrowLeftIcon size={19} className={styles.forwardArrow} aria-hidden="true" /></Link>
          </div>
          <p className={styles.cardFoot}>Already have an account? <Link href="/login">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
