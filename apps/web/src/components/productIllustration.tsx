import styles from './productIllustration.module.css';

const sceneDetails = {
  discovery: ['01 / FIND YOUR WAY', 'Explore a campus neighborhood and see homes along a student walking route.'],
  inspection: ['02 / VISIT BEFORE APPLYING', 'A student checks a room and records inspection notes before applying.'],
  verification: ['03 / SCHOOL REVIEW', 'A property and landlord record pass through separate review checks.'],
  landlord: ['04 / PREPARE A LISTING', 'A landlord adds a home and its available unit for school review.'],
  support: ['05 / GET SUPPORT', 'A housing issue is recorded and routed to the right person for resolution.'],
  browse: ['00 / PROPERTY DIRECTORY', 'Browseable listing records show prices, rooms, and location details.'],
  listingSetup: ['04 / PROPERTY DETAILS', 'A landlord prepares the property record and unit details for review.'],
  landlordDesk: ['LANDLORD DESK', 'A landlord tracks account verification and submitted property reviews.'],
  reviewDesk: ['SCHOOL REVIEW DESK', 'A reviewer checks separate landlord and property records.'],
  accountSetup: ['YOUR ULEY ACCOUNT', 'A student account keeps saved homes and housing requests together.'],
  passwordRecovery: ['ACCOUNT RECOVERY', 'A secure reset link returns account access to its owner.'],
} as const;

type IllustrationScene = keyof typeof sceneDetails;

export function ProductIllustration({ scene }: { scene: IllustrationScene }) {
  const [label, description] = sceneDetails[scene];
  return (
    <figure className={styles.figure}>
      <div className={styles.caption}><span className={styles.routeDot} />{label}<span>ULEY / FIELD GUIDE</span></div>
      <svg className={styles.art} viewBox="0 0 540 340" role="img" aria-label={description}>
        <rect x="1" y="1" width="538" height="338" rx="5" fill="var(--color-illustration-board)" />
        <circle cx="463" cy="61" r="28" fill="var(--color-citrus)" />
        <path d="M0 264c89-36 137-10 220 0s173-31 320 0v76H0z" fill="var(--color-illustration-ground)" />
        {scene === 'discovery' && <DiscoveryScene />}
        {scene === 'inspection' && <InspectionScene />}
        {scene === 'verification' && <VerificationScene />}
        {scene === 'landlord' && <LandlordScene />}
        {scene === 'support' && <SupportScene />}
        {scene === 'browse' && <BrowseScene />}
        {scene === 'listingSetup' && <ListingSetupScene />}
        {scene === 'landlordDesk' && <LandlordDeskScene />}
        {scene === 'reviewDesk' && <ReviewDeskScene />}
        {scene === 'accountSetup' && <AccountSetupScene />}
        {scene === 'passwordRecovery' && <PasswordRecoveryScene />}
      </svg>
      <figcaption>{description}</figcaption>
    </figure>
  );
}

function DiscoveryScene() {
  return <>
    <path d="M40 253c85-86 154-83 222-16s130 61 244-73" fill="none" stroke="var(--color-illustration-cream)" strokeWidth="25" />
    <path d="M40 253c85-86 154-83 222-16s130 61 244-73" fill="none" stroke="var(--color-illustration-route)" strokeWidth="2" strokeDasharray="5 9" />
    <House x={76} y={121} color="var(--color-illustration-cream)" /><House x={226} y={79} color="var(--color-illustration-sand)" /><House x={363} y={141} color="var(--color-surface)" />
    <Pin x={130} y={211} /><Pin x={312} y={187} /><MapCard />
  </>;
}

function InspectionScene() {
  return <>
    <rect x="47" y="48" width="187" height="162" rx="4" fill="var(--color-illustration-cream)" stroke="var(--color-primary-action)" strokeWidth="5" />
    <rect x="61" y="62" width="159" height="134" fill="var(--color-primary-soft)" />
    <path d="M140 62v134m-79-68h159" stroke="var(--color-illustration-cream)" strokeWidth="7" />
    <path d="M0 251h540" stroke="var(--color-illustration-route)" strokeWidth="6" />
    <rect x="279" y="218" width="176" height="28" rx="8" fill="var(--color-illustration-terracotta)" /><rect x="300" y="184" width="134" height="39" rx="17" fill="var(--color-illustration-cream)" />
    <path d="M300 245v24m132-24v24" stroke="var(--color-illustration-wood)" strokeWidth="10" />
    <Person x={246} y={138} /><Checklist />
  </>;
}

function VerificationScene() {
  return <>
    <rect x="67" y="67" width="260" height="199" rx="6" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <path d="M98 105h126M98 125h164M98 145h106" stroke="var(--color-illustration-stone)" strokeWidth="7" strokeLinecap="round" />
    <House x={109} y={171} color="var(--color-illustration-sand)" />
    <rect x="303" y="109" width="178" height="140" rx="6" fill="var(--color-illustration-cream)" stroke="var(--color-primary-action)" strokeWidth="2" />
    <circle cx="351" cy="157" r="23" fill="var(--color-trust-soft)" /><path d="m340 157 8 8 15-17" fill="none" stroke="var(--color-trust-green)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M388 148h63m-63 17h46M327 202h130" stroke="var(--color-illustration-stone)" strokeWidth="7" strokeLinecap="round" />
    <circle cx="448" cy="232" r="31" fill="var(--color-primary-action)" /><path d="m434 232 10 10 19-21" fill="none" stroke="var(--color-illustration-cream)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

function LandlordScene() {
  return <>
    <House x={72} y={106} color="var(--color-illustration-cream)" />
    <Person x={213} y={147} />
    <path d="M234 192h26v34h-26z" fill="var(--color-citrus)" stroke="var(--color-ink)" strokeWidth="3" /><circle cx="247" cy="203" r="3" fill="var(--color-ink)" /><path d="M247 226v9" stroke="var(--color-ink)" strokeWidth="3" />
    <rect x="318" y="85" width="158" height="177" rx="7" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <rect x="333" y="101" width="128" height="70" rx="3" fill="var(--color-primary-soft)" /><House x={370} y={124} color="var(--color-illustration-terracotta)" />
    <path d="M334 189h111m-111 19h88m-88 19h103" stroke="var(--color-illustration-stone)" strokeWidth="7" strokeLinecap="round" />
    <circle cx="459" cy="251" r="20" fill="var(--color-trust-soft)" /><path d="m450 251 6 6 12-14" fill="none" stroke="var(--color-trust-green)" strokeWidth="4" />
  </>;
}

function SupportScene() {
  return <>
    <House x={58} y={128} color="var(--color-illustration-cream)" />
    <rect x="230" y="72" width="204" height="116" rx="15" fill="var(--color-surface)" /><path d="m264 188-18 21v-21" fill="var(--color-surface)" />
    <circle cx="263" cy="103" r="8" fill="var(--color-illustration-leaf)" /><path d="M281 101h122m-122 21h94m-94 21h106" stroke="var(--color-illustration-stone)" strokeWidth="7" strokeLinecap="round" />
    <path d="M106 267c62 30 118 22 174 0s98-22 147 0" fill="none" stroke="var(--color-primary-action)" strokeWidth="5" strokeDasharray="3 10" />
    <circle cx="417" cy="260" r="32" fill="var(--color-citrus)" /><path d="m403 260 10 10 20-23" fill="none" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

function House({ x, y, color }: { x: number; y: number; color: string }) {
  return <g><path d={`M${x} ${y + 89}v-59l55-43 55 43v59z`} fill={color} stroke="var(--color-primary-action)" strokeWidth="3" strokeLinejoin="round" /><rect x={x + 17} y={y + 47} width="18" height="20" fill="var(--color-illustration-window)" /><rect x={x + 75} y={y + 47} width="18" height="20" fill="var(--color-illustration-window)" /><path d={`M${x + 47} ${y + 89}v-34h18v34`} fill="var(--color-illustration-terracotta)" /></g>;
}

function Pin({ x, y }: { x: number; y: number }) {
  return <g><circle cx={x} cy={y} r="13" fill="var(--color-primary-action)" stroke="var(--color-surface)" strokeWidth="4" /><path d={`M${x} ${y + 12}v17`} stroke="var(--color-primary-action)" strokeWidth="3" strokeDasharray="3 4" /></g>;
}

function Person({ x, y }: { x: number; y: number }) {
  return <g><circle cx={x} cy={y} r="15" fill="var(--color-illustration-wood)" /><path d={`M${x - 18} ${y + 20}q18-15 36 0v61h-36z`} fill="var(--color-trust-green)" /><path d={`m${x - 13} ${y + 34}-22 25m47-25 17 19`} stroke="var(--color-illustration-wood)" strokeWidth="7" strokeLinecap="round" /></g>;
}

function MapCard() {
  return <g><rect x="25" y="23" width="142" height="33" rx="4" fill="var(--color-ink)" /><circle cx="42" cy="39" r="5" fill="var(--color-citrus)" /><path d="M56 36h93m-93 7h72" stroke="var(--color-surface)" strokeWidth="3" strokeLinecap="round" /></g>;
}

function Checklist() {
  return <g><rect x="440" y="59" width="68" height="93" rx="5" fill="var(--color-primary-action)" /><rect x="450" y="72" width="48" height="67" rx="2" fill="var(--color-illustration-cream)" /><path d="m457 87 4 4 7-8m-11 20 4 4 7-8m-11 20 4 4 7-8" fill="none" stroke="var(--color-trust-green)" strokeWidth="3" strokeLinecap="round" /><path d="M478 87h13m-13 16h13m-13 16h13" stroke="var(--color-muted-ink)" strokeWidth="3" /></g>;
}

function BrowseScene() {
  return <>
    <rect x="34" y="45" width="472" height="38" rx="4" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <circle cx="58" cy="64" r="9" fill="none" stroke="var(--color-primary-action)" strokeWidth="3" /><path d="m65 71 7 7" stroke="var(--color-primary-action)" strokeWidth="3" />
    <path d="M88 60h160m-160 9h108" stroke="var(--color-muted-ink)" strokeWidth="5" strokeLinecap="round" />
    <ListingCard x={45} y={111} /><ListingCard x={290} y={111} />
  </>;
}

function ListingCard({ x, y }: { x: number; y: number }) {
  return <g><rect x={x} y={y} width="204" height="158" rx="4" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" /><rect x={x + 12} y={y + 11} width="180" height="76" fill="var(--color-primary-soft)" /><House x={x + 53} y={y + 27} color="var(--color-illustration-cream)" /><path d={`M${x + 14} ${y + 105}h116m-116 15h83`} stroke="var(--color-muted-ink)" strokeWidth="6" strokeLinecap="round" /><circle cx={x + 170} cy={y + 133} r="13" fill="var(--color-trust-soft)" /><path d={`m${x + 164} ${y + 133} 5 5 8-11`} fill="none" stroke="var(--color-trust-green)" strokeWidth="3" /></g>;
}

function ListingSetupScene() {
  return <>
    <rect x="48" y="47" width="253" height="229" rx="5" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <path d="M72 75h132m-132 15h195" stroke="var(--color-muted-ink)" strokeWidth="6" strokeLinecap="round" />
    <rect x="72" y="111" width="204" height="87" fill="var(--color-primary-soft)" /><House x={120} y={116} color="var(--color-illustration-sand)" />
    <path d="M72 216h87m-87 14h131m-131 14h72" stroke="var(--color-muted-ink)" strokeWidth="6" strokeLinecap="round" />
    <rect x="339" y="77" width="146" height="175" rx="5" fill="var(--color-illustration-cream)" stroke="var(--color-line)" strokeWidth="2" />
    <circle cx="370" cy="112" r="16" fill="var(--color-trust-soft)" /><path d="m363 112 6 6 10-13" fill="none" stroke="var(--color-trust-green)" strokeWidth="4" />
    <path d="M399 106h57m-57 15h43m-86 46h85m-85 16h71m-71 16h82" stroke="var(--color-muted-ink)" strokeWidth="6" strokeLinecap="round" />
  </>;
}

function LandlordDeskScene() {
  return <>
    <rect x="43" y="48" width="454" height="235" rx="4" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <rect x="43" y="48" width="454" height="39" fill="var(--color-ink)" />
    <circle cx="66" cy="67" r="7" fill="var(--color-citrus)" /><path d="M85 63h97m-97 8h66" stroke="var(--color-surface)" strokeWidth="4" strokeLinecap="round" />
    <rect x="61" y="105" width="128" height="145" fill="var(--color-primary-soft)" /><House x={71} y={140} color="var(--color-illustration-cream)" />
    <path d="M215 121h224m-224 16h166m-166 25h198" stroke="var(--color-muted-ink)" strokeWidth="7" strokeLinecap="round" />
    <rect x="215" y="187" width="241" height="43" fill="var(--color-paper)" /><circle cx="238" cy="208" r="10" fill="var(--color-trust-soft)" /><path d="m233 208 4 4 7-9" fill="none" stroke="var(--color-trust-green)" strokeWidth="3" />
    <path d="M258 204h105m-105 8h76" stroke="var(--color-muted-ink)" strokeWidth="4" strokeLinecap="round" />
  </>;
}

function ReviewDeskScene() {
  return <>
    <rect x="42" y="54" width="455" height="221" rx="5" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <rect x="42" y="54" width="455" height="46" fill="var(--color-ink)" />
    <path d="M62 73h123m-123 10h83" stroke="var(--color-surface)" strokeWidth="4" strokeLinecap="round" />
    <ReviewRow y={121} /><ReviewRow y={174} /><ReviewRow y={227} />
  </>;
}

function ReviewRow({ y }: { y: number }) {
  return <g><circle cx="75" cy={y} r="13" fill="var(--color-trust-soft)" /><path d={`m69 ${y} 5 5 8-11`} fill="none" stroke="var(--color-trust-green)" strokeWidth="3" /><path d={`M105 ${y - 6}h180m-180 13h123`} stroke="var(--color-muted-ink)" strokeWidth="5" strokeLinecap="round" /><rect x="407" y={y - 15} width="62" height="29" rx="3" fill="var(--color-surface)5d8" /><path d={`M420 ${y}h36`} stroke="var(--color-illustration-reject)" strokeWidth="4" strokeLinecap="round" /></g>;
}

function AccountSetupScene() {
  return <>
    <path d="M42 251c74-34 124-9 179 1s126 1 221-31" fill="none" stroke="var(--color-illustration-cream)" strokeWidth="25" />
    <path d="M42 251c74-34 124-9 179 1s126 1 221-31" fill="none" stroke="var(--color-illustration-route)" strokeWidth="2" strokeDasharray="4 8" />
    <House x={75} y={110} color="var(--color-illustration-cream)" /><Person x={268} y={153} />
    <rect x="346" y="101" width="135" height="135" rx="7" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <circle cx="413" cy="139" r="20" fill="var(--color-illustration-sand)" /><path d="M378 190q35-38 70 0v21h-70z" fill="var(--color-primary-action)" />
  </>;
}

function PasswordRecoveryScene() {
  return <>
    <rect x="74" y="66" width="250" height="198" rx="5" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
    <rect x="101" y="106" width="196" height="112" rx="4" fill="var(--color-primary-soft)" />
    <path d="M166 145v-15a33 33 0 0 1 66 0v15" fill="none" stroke="var(--color-primary-action)" strokeWidth="10" />
    <rect x="150" y="142" width="98" height="65" rx="8" fill="var(--color-primary-action)" />
    <circle cx="199" cy="169" r="8" fill="var(--color-citrus)" /><path d="M199 177v12" stroke="var(--color-citrus)" strokeWidth="5" />
    <path d="M367 103h89m-89 19h67" stroke="var(--color-muted-ink)" strokeWidth="7" strokeLinecap="round" />
    <circle cx="405" cy="201" r="33" fill="var(--color-citrus)" /><circle cx="405" cy="201" r="11" fill="none" stroke="var(--color-ink)" strokeWidth="5" /><path d="m414 210 25 25m-13-13 9-9" stroke="var(--color-ink)" strokeWidth="6" strokeLinecap="round" />
  </>;
}
