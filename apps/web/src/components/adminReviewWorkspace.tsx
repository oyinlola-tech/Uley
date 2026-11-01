'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { VerificationStatus } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import styles from './adminReviewWorkspace.module.css';
import { ProductIllustration } from './productIllustration';
import { AdminConsoleHeader } from './adminConsoleHeader';

type PendingLandlord = { landlordId: string; submittedAt: string; landlord: { fullName: string; email: string } };
type PendingProperty = { propertyId: string; submittedAt: string; property: { name: string; streetAddress: string; neighborhood: string; city: string; state: string; description: string; images: { id: string; imageUrl: string; altText: string }[]; landlord: { fullName: string; email: string }; units: { name: string; rentAmount: string; rentalPeriod: string; bedrooms: number; bathrooms: number }[] } };
type ReviewQueue = { landlordVerifications: PendingLandlord[]; propertyVerifications: PendingProperty[] };

export function AdminReviewWorkspace() {
  const [queue, setQueue] = useState<ReviewQueue>({ landlordVerifications: [], propertyVerifications: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const refreshQueue = useCallback(async () => {
    try { setQueue(await requestAdminApi<ReviewQueue>(WEB_API_ENDPOINTS.adminPendingReviews)); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refreshQueue(); }, [refreshQueue]);

  async function submitDecision(endpoint: string, formData: FormData) {
    setError(''); setNotice('');
    const decision = String(formData.get('decision'));
    const rejectionReason = String(formData.get('rejectionReason') ?? '').trim();
    try {
      await requestAdminApi(endpoint, { decision, ...(decision === 'REJECTED' ? { rejectionReason } : {}) });
      setNotice(decision === 'APPROVED' ? 'Review approved and status updated.' : 'Review rejected and the reason was recorded.');
      await refreshQueue();
    } catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/reviews" /><section className={styles.heading}><div className={styles.headingCopy}><p>ACCOUNTABILITY DESK</p><h1>Reviews that keep<br /><span>the listings honest.</span></h1><small>Review identity and property details using the school’s existing verification process. Each decision is tied to your admin account.</small></div><ProductIllustration scene="reviewDesk" /></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
    <section><h2>Landlord accounts <span>{queue.landlordVerifications.length}</span></h2>{loading ? <p>Loading review queue…</p> : queue.landlordVerifications.length === 0 ? <p className={styles.empty}>No landlord reviews are waiting.</p> : queue.landlordVerifications.map((item) => <article key={item.landlordId} className={styles.card}><div><p className={styles.eyebrow}>IDENTITY REVIEW</p><h3>{item.landlord.fullName}</h3><p>{item.landlord.email}</p><small>Requested {new Date(item.submittedAt).toLocaleDateString()}</small></div><form action={async (formData) => submitDecision(`${WEB_API_ENDPOINTS.adminLandlordReviews}/${item.landlordId}${WEB_API_ENDPOINTS.verificationReviewAction}`, formData)}><label>Reason if rejecting<input name="rejectionReason" minLength={10} placeholder="Explain what needs attention" /></label><div><button name="decision" value={VerificationStatus.APPROVED}>Approve account</button><button name="decision" value={VerificationStatus.REJECTED} className={styles.reject}>Reject</button></div></form></article>)}</section>
    <section><h2>Property listings <span>{queue.propertyVerifications.length}</span></h2>{loading ? <p>Loading review queue…</p> : queue.propertyVerifications.length === 0 ? <p className={styles.empty}>No properties are waiting for review.</p> : queue.propertyVerifications.map((item) => <article key={item.propertyId} className={styles.card}><div><p className={styles.eyebrow}>PROPERTY REVIEW</p><h3>{item.property.name}</h3><p>{item.property.streetAddress}, {item.property.neighborhood}, {item.property.city}, {item.property.state}</p><p>{item.property.description}</p><small>Landlord: {item.property.landlord.fullName} · {item.property.landlord.email}</small><ul>{item.property.units.map((unit) => <li key={unit.name}>{unit.name}: ₦{Number(unit.rentAmount).toLocaleString()} / {unit.rentalPeriod.toLowerCase()} · {unit.bedrooms} bed · {unit.bathrooms} bath</li>)}</ul><div className={styles.imageGallery}>{item.property.images.map((image) => <figure key={image.id}><Image src={image.imageUrl} alt={image.altText} width={320} height={240} unoptimized /><figcaption>{image.altText}</figcaption></figure>)}</div></div><form action={async (formData) => submitDecision(`${WEB_API_ENDPOINTS.adminPropertyReviews}/${item.propertyId}${WEB_API_ENDPOINTS.verificationReviewAction}`, formData)}><label>Reason if rejecting<input name="rejectionReason" minLength={10} placeholder="Explain what needs attention" /></label><div><button name="decision" value={VerificationStatus.APPROVED}>Approve & publish</button><button name="decision" value={VerificationStatus.REJECTED} className={styles.reject}>Reject</button></div></form></article>)}</section>
  </main>;
}

async function requestAdminApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | T | null;
  if (!response.ok) { const failure = payload as { error?: { message?: string }; requestId?: string } | null; throw new Error(getApiResponseErrorMessage(failure?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, failure?.requestId)); }
  return payload as T;
}
