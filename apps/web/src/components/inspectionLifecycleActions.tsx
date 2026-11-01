'use client';
import { useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { InspectionStatus } from '../enums';
import styles from './inspectionWorkspace.module.css';

export function InspectionLifecycleActions({ inspectionId, scheduledFor, propertyId, status, occupancyId, occupancyStatus, paymentConfirmed, reviewed, pendingRescheduleId, role, onUpdated }: { inspectionId: string; scheduledFor: string; propertyId: string; status: InspectionStatus; occupancyId?: string; occupancyStatus?: string; paymentConfirmed?: boolean; reviewed?: boolean; pendingRescheduleId?: string; role: 'STUDENT' | 'LANDLORD'; onUpdated: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function post(path: string, payload: unknown) {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { setMessage('Sign in again to continue.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${path}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('We could not save that change. Refresh and try again.');
      setMessage('Saved.'); onUpdated();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  if (role === 'STUDENT') return <div className={styles.lifecycle}>
    {(status === InspectionStatus.CONFIRMED || status === InspectionStatus.MISSED) && <form action={(data) => post(`${WEB_API_ENDPOINTS.inspections}/${inspectionId}${WEB_API_ENDPOINTS.inspectionRescheduleAction}`, { proposedFor: new Date(String(data.get('proposedFor'))).toISOString(), message: String(data.get('message') ?? '') })}><label>Suggest another time<input required type="datetime-local" name="proposedFor" min={new Date().toISOString().slice(0, 16)} /></label><button disabled={busy}>Request new time</button></form>}
    {status === InspectionStatus.CONFIRMED && new Date(scheduledFor) < new Date() && <button disabled={busy} onClick={() => void post(`${WEB_API_ENDPOINTS.inspections}/${inspectionId}${WEB_API_ENDPOINTS.inspectionMissedAction}`, {})}>Mark visit missed</button>}
    {status === InspectionStatus.CONFIRMED && new Date(scheduledFor) < new Date() && <form action={(data) => post(`${WEB_API_ENDPOINTS.inspections}/${inspectionId}${WEB_API_ENDPOINTS.inspectionFeedbackAction}`, { outcome: String(data.get('outcome')), ...(data.get('comment') ? { comment: String(data.get('comment')) } : {}), ...(data.get('moveInDate') ? { moveInDate: new Date(String(data.get('moveInDate'))).toISOString() } : {}), paymentReported: data.get('paymentReported') === 'on' })}><label>How did the visit go?<select name="outcome"><option value="INTERESTED">I’m interested</option><option value="NOT_INTERESTED">Not for me</option><option value="NEEDS_FOLLOW_UP">I need a follow-up</option><option value="SECURED">I got this home</option></select></label><label>Move-in date<input type="date" name="moveInDate" /></label><label>Notes<textarea name="comment" maxLength={1000} /></label><label><input type="checkbox" name="paymentReported" /> I have made a payment (reported only)</label><button disabled={busy}>Save visit outcome</button></form>}
    {occupancyId && <p>Move-in confirmation: {occupancyStatus?.toLowerCase().replaceAll('_', ' ')}. {reviewed ? 'Your review is under moderation or published.' : occupancyStatus === 'ACTIVE' ? 'Once payment is confirmed by your landlord, you can submit a verified home review.' : ''}</p>}
    {occupancyId && occupancyStatus === 'ACTIVE' && paymentConfirmed && !reviewed && <form action={(data) => post(`${WEB_API_ENDPOINTS.occupancyReviews}/${occupancyId}/reviews`, { rating: Number(data.get('rating')), comment: String(data.get('review') ?? '') })}><label>Rate this home<select name="rating"><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Good</option><option value="3">★★★ — Fair</option><option value="2">★★ — Poor</option><option value="1">★ — Very poor</option></select></label><label>Your review<textarea name="review" minLength={25} maxLength={1500} required /></label><button disabled={busy}>Submit verified review</button></form>}
    {!!message && <small role="status">{message}</small>}
  </div>;
  if (occupancyStatus === 'REQUESTED' && occupancyId) return <form className={styles.lifecycle} action={(data) => post(`${WEB_API_ENDPOINTS.landlordOccupancies}/${occupancyId}/respond`, { decision: 'CONFIRMED', paymentConfirmed: data.get('paymentConfirmed') === 'on', ...(data.get('paymentAmount') ? { paymentAmount: Number(data.get('paymentAmount')) } : {}) })}><label>Payment amount confirmed by you (₦)<input type="number" name="paymentAmount" min="1" /></label><label><input type="checkbox" name="paymentConfirmed" /> I confirm the student’s payment (optional)</label><button disabled={busy}>Confirm move-in</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => void post(`${WEB_API_ENDPOINTS.landlordOccupancies}/${occupancyId}/respond`, { decision: 'DECLINED', paymentConfirmed: false })}>Decline move-in record</button>{!!message && <small role="status">{message}</small>}</form>;
  if (role === 'LANDLORD' && pendingRescheduleId) return <div className={styles.lifecycle}><p>A student requested a different time.</p><button disabled={busy} onClick={() => void post(`${WEB_API_ENDPOINTS.landlordInspections}${WEB_API_ENDPOINTS.inspectionRescheduleResponseAction}/${pendingRescheduleId}/respond`, { decision: 'ACCEPTED' })}>Accept new time</button><button className={styles.secondary} disabled={busy} onClick={() => void post(`${WEB_API_ENDPOINTS.landlordInspections}${WEB_API_ENDPOINTS.inspectionRescheduleResponseAction}/${pendingRescheduleId}/respond`, { decision: 'DECLINED' })}>Decline</button>{!!message && <small role="status">{message}</small>}</div>;
  return null;
}
