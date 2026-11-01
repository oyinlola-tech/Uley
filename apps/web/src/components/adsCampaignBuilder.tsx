import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import type { DraftPreview } from './adsWorkspace.types';
import styles from './adsWorkspace.module.css';

export function CampaignBuilder({ isBusiness, preview, onPreviewChange, onSubmit, isBusy }: { isBusiness: boolean; preview: DraftPreview; onPreviewChange: (preview: DraftPreview) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; isBusy: boolean }) {
  function changePreview(field: keyof DraftPreview, value: string) { onPreviewChange({ ...preview, [field]: value }); }
  return <section className={styles.builderSection} id="new-campaign" aria-labelledby="create-campaign-heading">
    <SectionHeading eyebrow="BUILD A PLACEMENT" title="Create a community ad" description="Shape the message and see the card before you send it for review." />
    <div className={styles.builderGrid}>
      <form className={styles.panel} onSubmit={onSubmit}>
        <p className={styles.panelKicker}>CAMPAIGN DETAILS</p><h2 id="create-campaign-heading">Start with the essentials</h2>
        <div className={styles.form}>
          <FormSection number="01" title="What are you promoting?">
            <div className={styles.fields}>
              {!isBusiness && <label className={styles.field}>Ad category<select className={styles.select} name="category" defaultValue="SKILL" onChange={(event) => changePreview('category', event.target.value)}><option value="SKILL">Student skill or service</option><option value="JOB">Job opportunity</option></select></label>}
              <label className={`${styles.field} ${isBusiness ? styles.fieldFull : ''}`}>Headline<input className={styles.input} name="title" required minLength={5} maxLength={120} placeholder={isBusiness ? 'Fresh meals near campus' : 'Weekend photography sessions'} onChange={(event) => changePreview('title', event.target.value)} /></label>
              <label className={`${styles.field} ${styles.fieldFull}`}>Description<textarea className={styles.textarea} name="description" required minLength={30} maxLength={1200} placeholder="What are you offering? Include useful details and what someone should do next." onChange={(event) => changePreview('description', event.target.value)} /><small className={styles.hint}>Write for a student deciding whether this is useful to them.</small></label>
              <label className={`${styles.field} ${styles.fieldFull}`}>Ad image <span className={styles.optional}>OPTIONAL · MAX 10 MB</span><input className={styles.input} name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return changePreview('imageUrl', ''); const reader = new FileReader(); reader.onload = () => changePreview('imageUrl', String(reader.result ?? '')); reader.readAsDataURL(file); }} /><small className={styles.hint}>The image is scanned and held with your ad for school review.</small></label>
            </div>
          </FormSection>
          <FormSection number="02" title="Where should people find you?">
            <div className={styles.fields}><label className={styles.field}>City<input className={styles.input} name="city" required minLength={2} maxLength={120} placeholder="Akungba-Akoko" onChange={(event) => changePreview('city', event.target.value)} /></label><label className={styles.field}>Card appearance<select className={styles.select} name="presentationStyle" defaultValue="FEATURED" onChange={(event) => changePreview('style', event.target.value)}><option value="FEATURED">Featured · more detail</option><option value="COMPACT">Compact · shorter card</option></select></label></div>
            <p className={styles.placementNote}><span>●</span> Appears in the Uley community feed and is clearly marked as an ad.</p>
          </FormSection>
          <FormSection number="03" title="Budget and action">
            <div className={styles.fields}><label className={styles.field}>Campaign budget<input className={styles.input} name="budgetAmount" type="number" min="1000" max="100000000" step="100" required placeholder="e.g. 10,000" /><small className={styles.hint}>Your total campaign amount in naira. Payment is requested after approval.</small></label><label className={styles.field}>Button label<input className={styles.input} name="ctaLabel" required minLength={2} maxLength={40} defaultValue="Message" onChange={(event) => changePreview('ctaLabel', event.target.value)} /></label><label className={`${styles.field} ${styles.fieldFull}`}>Website link <span className={styles.optional}>OPTIONAL</span><input className={styles.input} name="ctaUrl" type="url" placeholder="https://your-site.ng" /><small className={styles.hint}>Use a secure https:// address. Leave blank to let people contact you through Uley.</small></label></div>
          </FormSection>
          <button className={styles.submit} disabled={isBusy}>{isBusy ? 'Sending for review…' : 'Submit for review'}<ArrowUpRightIcon size={16} weight="bold" /></button>
          <p className={styles.reviewNote}><span>i</span><span><strong>Review before payment.</strong> Uley checks each campaign first. Once approved, pay securely with Bachs before the ad runs.</span></p>
        </div>
      </form>
      <CampaignPreview isBusiness={isBusiness} preview={preview} />
    </div>
  </section>;
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <fieldset className={styles.formSection}><legend className={styles.formSectionTitle}><span className={styles.stepMark}>{number}</span>{title}</legend>{children}</fieldset>;
}

function CampaignPreview({ isBusiness, preview }: { isBusiness: boolean; preview: DraftPreview }) {
  const category = isBusiness ? 'LOCAL BUSINESS' : preview.category === 'JOB' ? 'STUDENT JOB' : 'STUDENT SKILL';
  return <aside className={styles.previewPanel} aria-label="Live community feed preview"><header className={styles.previewHeader}><p className={styles.previewKicker}>LIVE PREVIEW</p><span className={styles.previewStyle}>{preview.style === 'COMPACT' ? 'COMPACT CARD' : 'FEATURED CARD'}</span></header><div className={styles.previewBody}>
    <div className={styles.feedLabel}><span>ULEY · COMMUNITY FEED</span><span>ADVERTISEMENT</span></div>
    <article className={`${styles.adCard} ${preview.style === 'COMPACT' ? styles.adCardCompact : ''}`}>
      {preview.imageUrl && <img src={preview.imageUrl} alt="Selected ad preview" className={styles.adPreviewImage} />}
      <div className={styles.adOwner}><span className={styles.ownerMark}>{isBusiness ? 'B' : 'S'}</span><span className={styles.ownerName}>{isBusiness ? 'Local business' : 'Uley community member'}<small>{preview.city || 'Your city'}</small></span><span className={styles.sponsored}>Sponsored</span></div>
      <span className={styles.adType}>{category}</span><h3 className={styles.adTitle}>{preview.title || 'Your campaign headline'}</h3><p className={styles.adDescription}>{preview.description || 'A useful description helps students know what you offer and decide what to do next.'}</p>
      <div className={styles.adMeta}><span>{preview.city || 'Location'}</span><span>Provided by advertiser</span></div><span className={styles.previewButton}>{preview.ctaLabel || 'Message'}<ArrowUpRightIcon size={13} weight="bold" /></span>
    </article>
    <p className={styles.placementNote}><span>●</span> Ad label and feed placement are shown before your campaign is reviewed.</p>
  </div></aside>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className={styles.sectionHeader}><div><p className={styles.kicker}>{eyebrow}</p><h2>{title}</h2><p className={styles.sectionDescription}>{description}</p></div></div>;
}
