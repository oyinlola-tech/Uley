'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRightIcon, ChatCircleDotsIcon, MegaphoneIcon } from '@phosphor-icons/react/ssr';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import type { PublicUserAdvertisement } from '../models';
import { WEB_COMMUNITY_AD_ERROR_MESSAGES } from '../errors';
import styles from './communityAdCard.module.css';

export function CommunityAdCard({ ad }: { ad: PublicUserAdvertisement }) {
  const router = useRouter();
  const advertiserName = ad.advertiser.businessAdvertiserProfile?.businessName || ad.advertiser.fullName;
  const [contacting, setContacting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { void recordAdEvent(ad.id, 'IMPRESSION'); }, [ad.id]);

  async function contactAdvertiser() {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { router.push('/login?next=%2Flistings'); return; }
    setContacting(true);
    setError('');
    try {
      await recordAdEvent(ad.id, 'CLICK');
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.userAdvertisements}/${ad.id}${WEB_API_ENDPOINTS.userAdvertisementContactAction}`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
      const result = await response.json() as { conversation?: { id: string }; error?: { message?: string } };
      if (!response.ok || !result.conversation) throw new Error(result.error?.message ?? WEB_COMMUNITY_AD_ERROR_MESSAGES.contactUnavailable);
      router.push(`/messages?conversationId=${result.conversation.id}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : WEB_COMMUNITY_AD_ERROR_MESSAGES.contactUnavailable); }
    finally { setContacting(false); }
  }

  async function reportAdvertiserAd() {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { setError('Sign in to report this ad.'); return; }
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.contentReports}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ userAdvertisementId: ad.id, reason: 'OTHER', details: 'Reported from the community ad.' }) });
      if (!response.ok) throw new Error(WEB_COMMUNITY_AD_ERROR_MESSAGES.contactUnavailable);
      setError(''); setNotice('Report sent to the school safety team.');
    } catch { setError('Unable to submit this report.'); }
  }

  const category = ad.category === 'JOB' ? 'STUDENT OPPORTUNITY' : ad.category === 'SKILL' ? 'STUDENT SERVICE' : 'LOCAL BUSINESS';
  return <article className={styles.card} data-style={ad.presentationStyle}>
    <div className={styles.topline}><span><MegaphoneIcon size={14} weight="fill" /> PAID COMMUNITY AD</span><span>{category}</span></div>
    {ad.imageUrl && <img className={styles.image} src={ad.imageUrl} alt={`${ad.title} advertisement`} />}
    <div className={styles.body}><div className={styles.owner}><span className={styles.avatar}>{advertiserName.trim().charAt(0).toUpperCase()}</span><span>{advertiserName}<small>{ad.advertiser.university?.name ?? 'Uley community'} · {ad.city}</small></span></div>
      <h3>{ad.title}</h3><p>{ad.description}</p>{error && <small className={styles.error} role="alert">{error}</small>}{notice && <small className={styles.notice} role="status">{notice}</small>}
      {ad.ctaUrl ? <a className={styles.action} href={ad.ctaUrl} target="_blank" rel="noreferrer" onClick={() => void recordAdEvent(ad.id, 'CLICK')}>{ad.ctaLabel}<ArrowUpRightIcon size={15} weight="bold" /></a> : <button className={styles.action} onClick={() => void contactAdvertiser()} disabled={contacting}><ChatCircleDotsIcon size={15} />{contacting ? 'Opening chat…' : ad.ctaLabel}</button>}
      <button className={styles.report} onClick={() => void reportAdvertiserAd()}>Report this ad</button>
    </div>
  </article>;
}

async function recordAdEvent(advertisementId: string, eventType: 'IMPRESSION' | 'CLICK') {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) return;
  try { await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.userAdvertisements}/${advertisementId}${WEB_API_ENDPOINTS.userAdvertisementEventAction}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ eventType }), keepalive: true }); } catch { /* Feed analytics must not block reading listings. */ }
}
