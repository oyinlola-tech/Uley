'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { InspectionStatus } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import type { InspectionListResponse, InspectionRecord } from '../models';
import styles from './inspectionWorkspace.module.css';
import { InspectionLocationControl } from './inspectionLocationControl';
import { InspectionLifecycleActions } from './inspectionLifecycleActions';
import { NotificationFeed } from './notificationFeed';
import { RentalApplicationActions } from './rentalApplicationActions';

export function StudentInspectionWorkspace() {
  const [requests, setRequests] = useState<InspectionRecord[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadRequests = useCallback(async () => {
    try { setRequests((await requestInspectionApi<InspectionListResponse>(WEB_API_ENDPOINTS.inspections)).inspections); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.inspectionsUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setSelectedUnit(parameters.get('unitId') ?? '');
    setPropertyName(parameters.get('propertyName') ?? '');
    setUnitName(parameters.get('unitName') ?? '');
    void loadRequests();
  }, [loadRequests]);
  async function submitInspection(formData: FormData) {
    setError(''); setNotice('');
    const localDate = String(formData.get('scheduledFor'));
    try {
      await requestInspectionApi(WEB_API_ENDPOINTS.inspections, { unitId: selectedUnit, scheduledFor: new Date(localDate).toISOString(), studentMessage: String(formData.get('studentMessage') ?? '').trim() });
      setNotice(WEB_ERROR_MESSAGES.inspectionRequestSent);
      await loadRequests();
    } catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><header><Link href="/listings">← Browse homes</Link><Link href="/applications">My applications</Link></header><section className={styles.heading}><p>VISIT THE HOME FIRST</p><h1>Plan a viewing<br /><span>with the landlord.</span></h1><small>Choose a time that works for you. Your request stays attached to the property and unit you selected.</small></section>
    {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
    {selectedUnit && <section className={styles.panel}><p className={styles.eyebrow}>NEW INSPECTION REQUEST</p><h2>{propertyName || 'Selected property'}{unitName ? ` · ${unitName}` : ''}</h2><form action={async (formData) => submitInspection(formData)}><label>Preferred date and time<input name="scheduledFor" type="datetime-local" min={getMinimumDateTime()} required /></label><label>Message for the landlord <span>Optional</span><textarea name="studentMessage" maxLength={500} placeholder="Share anything the landlord should know before the visit." /></label><button>Send inspection request</button></form></section>}
    <NotificationFeed /><section className={styles.requests}><h2>Your inspection requests</h2>{loading ? <p>Loading requests…</p> : requests.length === 0 ? <p className={styles.empty}>No inspections yet. Browse verified homes and choose a unit to arrange a visit.</p> : requests.map((item) => <InspectionCard key={item.id} item={item} onUpdated={loadRequests} />)}</section>
  </main>;
}

export function LandlordInspectionWorkspace() {
  const [requests, setRequests] = useState<InspectionRecord[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadRequests = useCallback(async () => {
    try { setRequests((await requestInspectionApi<InspectionListResponse>(WEB_API_ENDPOINTS.landlordInspections)).inspections); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.inspectionsUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadRequests(); }, [loadRequests]);
  async function answerInspection(inspectionId: string, decision: 'CONFIRMED' | 'DECLINED') {
    try { await requestInspectionApi(`${WEB_API_ENDPOINTS.landlordInspections}/${inspectionId}${WEB_API_ENDPOINTS.inspectionResponseAction}`, { decision }); setNotice(`Inspection ${decision.toLowerCase()}.`); await loadRequests(); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><header><Link href="/landlord">← Landlord workspace</Link><nav><Link href="/landlord/applications">Rental applications</Link><Link href="/listings">Public listings</Link></nav></header><section className={styles.heading}><p>LANDLORD VISIT DESK</p><h1>Respond to<br /><span>inspection requests.</span></h1><small>Confirm a time or decline with a clear response so students know what to expect.</small></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}<NotificationFeed /><section className={styles.requests}><h2>Requests for your properties</h2>{loading ? <p>Loading requests…</p> : requests.length === 0 ? <p className={styles.empty}>No students have requested a visit yet.</p> : requests.map((item) => <article className={styles.card} key={item.id}><p className={styles.eyebrow}>{item.status.replaceAll('_', ' ')}</p><h3>{item.property.name} · {item.unit.name}</h3><p>{item.student?.fullName} · {item.student?.email}</p><p>{new Date(item.scheduledFor).toLocaleString()}</p>{item.studentMessage && <blockquote>{item.studentMessage}</blockquote>}{item.landlordResponse && <p>{item.landlordResponse}</p>}{item.status === InspectionStatus.REQUESTED && <div className={styles.actions}><button onClick={() => void answerInspection(item.id, 'CONFIRMED')}>Confirm visit</button><button className={styles.secondary} onClick={() => void answerInspection(item.id, 'DECLINED')}>Decline</button></div>}<InspectionLifecycleActions inspectionId={item.id} scheduledFor={item.scheduledFor} propertyId={item.property.id} status={item.status} role="LANDLORD" occupancyId={item.occupancy?.id} occupancyStatus={item.occupancy?.status} paymentConfirmed={Boolean(item.occupancy?.paymentConfirmedAt)} pendingRescheduleId={item.rescheduleRequests?.find((change) => change.status === 'PENDING')?.id} onUpdated={loadRequests} /><InspectionLocationControl inspectionId={item.id} status={item.status} role="LANDLORD" /></article>)}</section></main>;
}

function InspectionCard({ item, onUpdated }: { item: InspectionRecord; onUpdated: () => void }) { return <article className={styles.card}><p className={styles.eyebrow}>{item.status.replaceAll('_', ' ')}</p><h3>{item.property.name} · {item.unit.name}</h3><p>{item.property.neighborhood}, {item.property.city}</p><p>{new Date(item.scheduledFor).toLocaleString()}</p>{item.landlordResponse && <blockquote>{item.landlordResponse}</blockquote>}<InspectionLifecycleActions inspectionId={item.id} scheduledFor={item.scheduledFor} propertyId={item.property.id} status={item.status} role="STUDENT" occupancyId={item.occupancy?.id} occupancyStatus={item.occupancy?.status} paymentConfirmed={Boolean(item.occupancy?.paymentConfirmedAt)} reviewed={Boolean(item.occupancy?.review)} onUpdated={onUpdated} /><RentalApplicationActions inspectionId={item.id} status={item.status} feedback={item.feedback} application={item.rentalApplication} occupancyId={item.occupancy?.id} onUpdated={onUpdated} /><InspectionLocationControl inspectionId={item.id} status={item.status} role="STUDENT" /></article>; }
async function requestInspectionApi<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | T | null;
  if (!response.ok) { const failure = payload as { error?: { message?: string }; requestId?: string } | null; throw new Error(getApiResponseErrorMessage(failure?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, failure?.requestId)); }
  return payload as T;
}
function getMinimumDateTime() { const date = new Date(Date.now() + 60 * 60 * 1000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); }
