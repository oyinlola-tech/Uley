import { ArrowUpRightIcon, ChartLineUpIcon, CursorClickIcon, EyeIcon, MegaphoneIcon } from '@phosphor-icons/react/ssr';
import type { Ad, Analytics } from './adsWorkspace.types';
import styles from './adsWorkspace.module.css';

export function CampaignMetrics({ analytics }: { analytics: Analytics }) {
  return <section className={styles.metrics} aria-label="Campaign performance summary">
    <Metric icon={<EyeIcon size={17} />} label="Impressions" value={analytics.impressions.toLocaleString()} note="Times your ads were seen" />
    <Metric icon={<CursorClickIcon size={17} />} label="Clicks" value={analytics.clicks.toLocaleString()} note="Visits from your call to action" />
    <Metric icon={<ChartLineUpIcon size={17} />} label="Click-through rate" value={`${analytics.clickThroughRate}%`} note="Clicks as a share of views" />
    <Metric icon={<MegaphoneIcon size={17} />} label="Running campaigns" value={analytics.activeAds} note="Approved and paid ads" />
  </section>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) {
  return <article className={styles.metric}><span className={styles.metricIcon}>{icon}</span><span className={styles.metricLabel}>{label}</span><strong className={styles.metricValue}>{value}</strong><small className={styles.metricNote}>{note}</small></article>;
}

export function CampaignAnalytics({ analytics }: { analytics: Analytics | null }) {
  const impressions = analytics?.impressions ?? 0;
  const clicks = analytics?.clicks ?? 0;
  const top = Math.max(impressions, clicks, 1);
  return <section className={styles.analyticsGrid} aria-label="Campaign analytics breakdown">
    <div className={styles.analyticsPanel}><p className={styles.panelKicker}>CAMPAIGN ACTIVITY</p><h2>Views and actions</h2><p className={styles.sectionDescription}>A quick read of how people are responding to your paid community ads.</p>
      <div className={styles.barList}><AnalyticsBar label="Impressions" value={impressions} max={top} /><AnalyticsBar label="Clicks" value={clicks} max={top} /></div>
    </div>
    <div className={styles.analyticsAside}><span>CLICK-THROUGH RATE</span><strong>{analytics?.clickThroughRate ?? 0}%</strong><p>Share of impressions that led to a campaign click. Results update as impressions and clicks are recorded.</p></div>
  </section>;
}

function AnalyticsBar({ label, value, max }: { label: string; value: number; max: number }) {
  return <div className={styles.barRow}><span>{label}</span><span className={styles.barTrack}><span className={styles.barFill} style={{ width: `${Math.max(value / max * 100, value ? 3 : 0)}%` }} /></span><strong className={styles.barValue}>{value.toLocaleString()}</strong></div>;
}

export function CampaignList({ campaigns, analyticsOnly, selectedIds, onSelectionChange, onBatchCheckout, isCheckoutBusy, statusBusyId, onStatusChange, onContinueCheckout }: { campaigns: Ad[]; analyticsOnly: boolean; selectedIds: string[]; onSelectionChange: (ids: string[]) => void; onBatchCheckout: () => void; isCheckoutBusy: boolean; statusBusyId: string; onStatusChange: (ad: Ad) => void; onContinueCheckout: (ad: Ad) => void }) {
  const payable = campaigns.filter((ad) => ad.status === 'APPROVED' && !ad.paymentConfirmedAt && !ad.checkoutReservation);
  return <section className={styles.campaignSection} aria-labelledby="campaign-list-heading"><div className={styles.panel}>
    <div className={styles.campaignTop}><div><p className={styles.panelKicker}>{analyticsOnly ? 'CAMPAIGN REPORTS' : 'YOUR CAMPAIGNS'}</p><h2 id="campaign-list-heading">{analyticsOnly ? 'Performance by campaign' : 'Review, pay, and track'}</h2></div>{selectedIds.length > 0 && <button className={styles.checkout} onClick={onBatchCheckout} disabled={isCheckoutBusy}>{isCheckoutBusy ? 'Opening secure checkout…' : `Pay for ${selectedIds.length} campaign${selectedIds.length === 1 ? '' : 's'} with Bachs`}</button>}</div>
    {campaigns.length ? <div className={styles.campaignList}>{campaigns.map((ad) => <CampaignRow key={ad.id} ad={ad} analyticsOnly={analyticsOnly} isPayable={payable.some((item) => item.id === ad.id)} isSelected={selectedIds.includes(ad.id)} isStatusBusy={statusBusyId === ad.id} onSelectionChange={(selected) => onSelectionChange(selected ? [...selectedIds, ad.id] : selectedIds.filter((id) => id !== ad.id))} onStatusChange={() => onStatusChange(ad)} onContinueCheckout={() => onContinueCheckout(ad)} />)}</div> : <EmptyCampaignState analyticsOnly={analyticsOnly} />}
  </div></section>;
}

function CampaignRow({ ad, analyticsOnly, isPayable, isSelected, isStatusBusy, onSelectionChange, onStatusChange, onContinueCheckout }: { ad: Ad; analyticsOnly: boolean; isPayable: boolean; isSelected: boolean; isStatusBusy: boolean; onSelectionChange: (selected: boolean) => void; onStatusChange: () => void; onContinueCheckout: () => void }) {
  const expires = new Date(ad.endsAt);
  const checkoutActive = Boolean(ad.checkoutReservation && new Date(ad.checkoutReservation.expiresAt) > new Date());
  return <article className={styles.campaign}>
    <div><div className={styles.campaignTitleRow}><h3 className={styles.campaignTitle}>{ad.title}</h3><span className={styles.badge} data-status={ad.status}>{formatStatus(ad.status)}</span></div><p className={styles.campaignDescription}>{ad.description}</p>
      <div className={styles.campaignMeta}><span>{formatCategory(ad.category)}</span><span>{ad.city}</span><span>Budget <strong>₦{Number(ad.budgetAmount).toLocaleString()}</strong></span><span>Ends {expires.toLocaleDateString()}</span>{ad.decisionNote && <span>Review note: {ad.decisionNote}</span>}</div>
    </div>
    <div className={styles.campaignActions}><div className={styles.campaignResult}><strong>{ad.paymentConfirmedAt ? 'Paid campaign' : formatStatus(ad.status)}</strong>{ad.impressionCount.toLocaleString()} views · {ad.clickCount.toLocaleString()} clicks</div>
      {!analyticsOnly && isPayable && <label className={styles.payChoice}><input type="checkbox" checked={isSelected} disabled={Boolean(ad.checkoutReservation)} onChange={(event) => onSelectionChange(event.target.checked)} />Select for Bachs payment</label>}
      {!analyticsOnly && ad.checkoutReservation && <button className={styles.campaignButton} onClick={onContinueCheckout}>{checkoutActive ? 'Continue checkout' : 'Check payment status'}<ArrowUpRightIcon size={13} /></button>}
      {!analyticsOnly && ad.paymentConfirmedAt && ['APPROVED', 'PAUSED'].includes(ad.status) && <button className={styles.campaignButton} onClick={onStatusChange} disabled={isStatusBusy}>{isStatusBusy ? 'Updating…' : ad.status === 'PAUSED' ? 'Resume campaign' : 'Pause campaign'}</button>}
      {!analyticsOnly && ad.status === 'PENDING_REVIEW' && <span className={styles.campaignButton}>In review</span>}
    </div>
  </article>;
}

function EmptyCampaignState({ analyticsOnly }: { analyticsOnly: boolean }) {
  return <div className={styles.empty}><span className={styles.emptyMark}>↗</span><h3>{analyticsOnly ? 'No campaign results yet' : 'Your first campaign starts here'}</h3><p>{analyticsOnly ? 'Once you create, approve, and run a campaign, its views and clicks will be summarized here.' : 'Create a student skill, job, or local service ad. You can review its feed card before submitting it.'}</p>{!analyticsOnly && <a className={styles.headingLink} href="#new-campaign">Build your first ad</a>}</div>;
}

function formatStatus(status: string) { return ({ PENDING_REVIEW: 'In review', APPROVED: 'Approved', PAUSED: 'Paused', REJECTED: 'Needs changes', COMPLETED: 'Ended' } as Record<string, string>)[status] ?? status.replaceAll('_', ' '); }
function formatCategory(category: string) { return ({ SKILL: 'Student skill', JOB: 'Student job', LOCAL_SERVICE: 'Local business' } as Record<string, string>)[category] ?? category.replaceAll('_', ' '); }
