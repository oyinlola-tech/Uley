import { SealCheckIcon, ClipboardTextIcon, EyeIcon } from '@phosphor-icons/react/ssr';

const trustPrinciples = [
  {
    icon: SealCheckIcon,
    title: 'Know who is listing',
    description: 'Landlords go through a verification process before their homes can be published.',
  },
  {
    icon: EyeIcon,
    title: 'See the details upfront',
    description: 'Compare location, costs, and room details before spending time on a viewing.',
  },
  {
    icon: ClipboardTextIcon,
    title: 'See what happens next',
    description: 'Inspection requests and listing reports have a clear route. Applications and formal housing complaints are still being built.',
  },
];

export function TrustPrinciplesSection() {
  return (
    <section className="trust-section" id="verification" aria-labelledby="trust-heading">
      <div className="page-container">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow eyebrow--blue">A little more certainty</p>
            <h2 id="trust-heading">A good search should answer the big questions.</h2>
          </div>
          <p className="section-intro__body">
            Is the person responsible for this home known? What will it cost? Can I see it before I decide? Uley puts those answers where they belong: in the open.
          </p>
        </div>
        <div className="trust-grid">
          {trustPrinciples.map(({ icon: PrincipleIcon, title, description }, index) => (
            <article className="trust-card" key={title}>
              <span className="trust-card__index">0{index + 1}</span>
              <div className="trust-card__icon"><PrincipleIcon size={21} weight="duotone" aria-hidden="true" /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
