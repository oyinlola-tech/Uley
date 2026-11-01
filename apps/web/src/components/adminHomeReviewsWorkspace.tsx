'use client';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import { AdminConsoleHeader } from './adminConsoleHeader';
import styles from './adminReviewWorkspace.module.css';

type Review = { id: string; rating: number; comment: string; createdAt: string; property: { name: string; city: string }; student: { fullName: string } };
export function AdminHomeReviewsWorkspace() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    try { setReviews((await request<{ reviews: Review[] }>(WEB_API_ENDPOINTS.adminHomeReviews)).reviews); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function decide(id: string, decision: 'APPROVED' | 'REJECTED', reviewNote: string) {
    try { await request(`${WEB_API_ENDPOINTS.adminHomeReviews}/${id}/review`, { decision, ...(reviewNote ? { reviewNote } : {}) }); setNotice(decision === 'APPROVED' ? 'Review approved for public display.' : 'Review rejected with a recorded moderation action.'); await refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save review decision.'); }
  }
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/home-reviews"/><section className={styles.heading}><div className={styles.headingCopy}><p>OCCUPANCY-VERIFIED FEEDBACK</p><h1>Home reviews<br/><span>awaiting moderation.</span></h1><small>Only students with an active occupancy and landlord-confirmed payment can submit a review. Approval controls whether it appears publicly.</small></div></section>{error && <p className={styles.error}>{error}</p>}{notice && <p className={styles.notice}>{notice}</p>}{reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} onDecision={decide}/>) : <p className={styles.empty}>No verified home reviews are waiting.</p>}</main>;
}
function ReviewCard({ review, onDecision }: { review: Review; onDecision: (id: string, decision: 'APPROVED'|'REJECTED', note: string) => void }) {
  const [note, setNote] = useState('');
  return <article className={styles.card}><div><p className={styles.eyebrow}>{review.rating} / 5 · VERIFIED OCCUPANCY</p><h3>{review.property.name}, {review.property.city}</h3><p>{review.student.fullName} · {new Date(review.createdAt).toLocaleDateString()}</p><p>{review.comment}</p></div><label>Moderation note<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500}/></label><div><button onClick={() => onDecision(review.id, 'APPROVED', note)}>Approve</button><button onClick={() => onDecision(review.id, 'REJECTED', note)}>Reject</button></div></article>;
}
async function request<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => null) as (T & { error?: { message?: string } }) | null;
  if (!response.ok) throw new Error(payload?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry);
  return payload as T;
}
