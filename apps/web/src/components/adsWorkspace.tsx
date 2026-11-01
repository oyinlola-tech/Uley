'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, ChartLineUpIcon, MegaphoneIcon } from '@phosphor-icons/react/ssr';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_USER_ADVERTISEMENT_LIMITS } from '../constants';
import { AccountRole } from '../enums';
import { useWebSessionRole } from './useWebSessionRole';
import { AdsAccessLanding } from './adsAccessLanding';
import { CampaignBuilder } from './adsCampaignBuilder';
import { CampaignAnalytics, CampaignList, CampaignMetrics } from './adsCampaignReporting';
import type { Ad, Analytics, DraftPreview } from './adsWorkspace.types';
import styles from './adsWorkspace.module.css';

export function AdsWorkspace({ analyticsOnly = false }: { analyticsOnly?: boolean }) {
  const role = useWebSessionRole();
  const [ads, setAds] = useState<Ad[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<DraftPreview>({ title: '', description: '', city: '', ctaLabel: 'Message', style: 'FEATURED', category: 'SKILL' });
  const [pendingImageUpload, setPendingImageUpload] = useState<{ advertisementId: string; file: File } | null>(null);
  const isBusiness = role === AccountRole.BUSINESS_ADVERTISER;
  const canManageAds = role === AccountRole.STUDENT || isBusiness;

  const refreshCampaigns = useCallback(async () => {
    try {
      const [list, report] = await Promise.all([
        request<{ advertisements: Ad[] }>(WEB_API_ENDPOINTS.userAdvertisementMine),
        request<{ analytics: Analytics }>(WEB_API_ENDPOINTS.userAdvertisementAnalytics),
      ]);
      setAds(list.advertisements);
      setAnalytics(report.analytics);
      setError('');
    } catch (failure) { setError(readError(failure)); }
  }, []);

  useEffect(() => { if (canManageAds) void refreshCampaigns(); }, [canManageAds, refreshCampaigns]);
  useEffect(() => { void verifyReturnedCheckout(); }, [refreshCampaigns]);

  async function verifyReturnedCheckout() {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) return;
    try {
      const result = await request<{ paid: boolean }>(`${WEB_API_ENDPOINTS.userAdvertisementCheckoutVerify}?reference=${encodeURIComponent(reference)}`);
      setNotice(result.paid ? 'Payment confirmed. Your ad is ready to appear.' : 'Payment is processing. Check the campaign again shortly.');
      window.history.replaceState({}, '', window.location.pathname);
      await refreshCampaigns();
    } catch (failure) { setError(readError(failure)); }
  }

  async function submitCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let createdAdvertisementId = '';
    try {
      const image = form.get('image');
      if (image instanceof File && image.size > WEB_USER_ADVERTISEMENT_LIMITS.maximumImageBytes) throw new Error('Choose an image smaller than 10 MB.');
      if (image instanceof File && image.size && !(WEB_USER_ADVERTISEMENT_LIMITS.allowedImageTypes as readonly string[]).includes(image.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
      const created = await request<{ advertisement: { id: string } }>(WEB_API_ENDPOINTS.userAdvertisements, {
        category: isBusiness ? 'LOCAL_SERVICE' : String(form.get('category')),
        title: String(form.get('title')).trim(),
        description: String(form.get('description')).trim(),
        city: String(form.get('city')).trim(),
        budgetAmount: Number(form.get('budgetAmount')),
        ctaLabel: String(form.get('ctaLabel')).trim(),
        ...(String(form.get('ctaUrl') ?? '').trim() ? { ctaUrl: String(form.get('ctaUrl')).trim() } : {}),
        presentationStyle: String(form.get('presentationStyle')),
      });
      createdAdvertisementId = created.advertisement.id;
      if (image instanceof File && image.size) { setPendingImageUpload({ advertisementId: createdAdvertisementId, file: image }); await uploadAdvertisementImage(createdAdvertisementId, image); setPendingImageUpload(null); }
      setNotice('Campaign and image sent for review. We’ll let you know when it is ready for payment.');
      formElement.reset();
      setPreview({ title: '', description: '', city: '', ctaLabel: 'Message', style: 'FEATURED', category: 'SKILL' });
      await refreshCampaigns();
    } catch (failure) { setError(createdAdvertisementId ? 'Your ad was created, but its image could not be uploaded. Retry the image upload below; do not submit the campaign again.' : readError(failure)); if (createdAdvertisementId) { setNotice('The campaign is awaiting review. Its image is still pending.'); await refreshCampaigns(); } }
    finally { setBusy(false); }
  }

  async function retryAdvertisementImageUpload() {
    if (!pendingImageUpload) return;
    setBusy(true); setError('');
    try { await uploadAdvertisementImage(pendingImageUpload.advertisementId, pendingImageUpload.file); setPendingImageUpload(null); setNotice('Ad image scanned and attached for review.'); await refreshCampaigns(); }
    catch (failure) { setError(readError(failure)); }
    finally { setBusy(false); }
  }

  async function openBatchCheckout() {
    setCheckoutBusy(true);
    setError('');
    try {
      const result = await request<{ checkout: { authorizationUrl: string } }>(WEB_API_ENDPOINTS.userAdvertisementCheckouts, { advertisementIds: selectedIds });
      window.location.assign(result.checkout.authorizationUrl);
    } catch (failure) { setError(readError(failure)); setCheckoutBusy(false); }
  }

  async function continueOrCheckCampaignPayment(ad: Ad) {
    const checkout = ad.checkoutReservation;
    if (!checkout) return;
    if (new Date(checkout.expiresAt) > new Date()) { window.location.assign(checkout.authorizationUrl); return; }
    try {
      const result = await request<{ paid: boolean }>(`${WEB_API_ENDPOINTS.userAdvertisementCheckoutVerify}?reference=${encodeURIComponent(checkout.reference)}`);
      setNotice(result.paid ? 'Payment confirmed.' : 'This checkout expired. Select the approved campaign to start another.');
      await refreshCampaigns();
    } catch (failure) { setError(readError(failure)); }
  }

  async function changeCampaignStatus(ad: Ad) {
    const status = ad.status === 'PAUSED' ? 'APPROVED' : 'PAUSED';
    setStatusBusyId(ad.id);
    setError('');
    try {
      await request(`${WEB_API_ENDPOINTS.userAdvertisements}/${ad.id}${WEB_API_ENDPOINTS.userAdvertisementStatusAction}`, { status }, 'PATCH');
      setNotice(status === 'PAUSED' ? 'Campaign paused.' : 'Campaign resumed.');
      await refreshCampaigns();
    } catch (failure) { setError(readError(failure)); }
    finally { setStatusBusyId(''); }
  }

  if (!canManageAds) return <AdsAccessLanding role={role} />;
  return <main className={styles.page}>
    <WorkspaceHeading analyticsOnly={analyticsOnly} />
    {(error || notice) && <div className={styles.alerts}>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}</div>}
    {pendingImageUpload && <button className={styles.checkout} onClick={() => void retryAdvertisementImageUpload()} disabled={busy}>Retry ad image upload</button>}
    {analytics && <CampaignMetrics analytics={analytics} />}
    {analyticsOnly ? <CampaignAnalytics analytics={analytics} /> : <CampaignBuilder isBusiness={isBusiness} preview={preview} onPreviewChange={setPreview} onSubmit={submitCampaign} isBusy={busy || Boolean(pendingImageUpload)} />}
    <CampaignList campaigns={ads} analyticsOnly={analyticsOnly} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onBatchCheckout={() => void openBatchCheckout()} isCheckoutBusy={checkoutBusy} statusBusyId={statusBusyId} onStatusChange={(ad) => void changeCampaignStatus(ad)} onContinueCheckout={(ad) => void continueOrCheckCampaignPayment(ad)} />
  </main>;
}

function WorkspaceHeading({ analyticsOnly }: { analyticsOnly: boolean }) {
  return <header className={styles.heading}><div><p className={styles.kicker}>ULEY · CAMPAIGNS</p><h1>{analyticsOnly ? 'Campaign results' : 'Your Ads Manager'}</h1><p className={styles.headingDescription}>{analyticsOnly ? 'See how your approved campaigns are reaching the Uley community.' : 'Build your campaign, review its feed preview, then pay after approval.'}</p></div><div className={styles.headingActions}>{analyticsOnly ? <Link className={styles.headingLink} href="/ads"><MegaphoneIcon size={15} />Ads Manager</Link> : <Link className={styles.headingLink} href="/ads/analytics"><ChartLineUpIcon size={15} />View analytics</Link>}{!analyticsOnly && <a className={styles.createLink} href="#new-campaign">Create campaign <ArrowRightIcon size={15} weight="bold" /></a>}</div></header>;
}

async function request<T = unknown>(path: string, body?: unknown, method?: 'GET' | 'POST' | 'PATCH'): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error('Sign in to manage ads.');
  const response = await fetch(WEB_API_BASE_PATH + path, { method: method ?? (body ? 'POST' : 'GET'), headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) throw new Error((result as { error?: { message?: string } } | null)?.error?.message ?? 'The request could not be completed.');
  return result as T;
}
async function uploadAdvertisementImage(advertisementId: string, file: File) {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error('Sign in to manage ads.');
  const formData = new FormData(); formData.append('image', file);
  const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.userAdvertisements}/${advertisementId}${WEB_API_ENDPOINTS.userAdvertisementImageAction}`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: formData });
  if (!response.ok) { const result = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(result?.error?.message ?? 'The image could not be scanned.'); }
}
function readError(failure: unknown) { return failure instanceof Error ? failure.message : 'The request could not be completed.'; }
