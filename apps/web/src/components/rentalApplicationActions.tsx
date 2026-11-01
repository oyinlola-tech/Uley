'use client';
import { useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { WEB_ERROR_MESSAGES } from '../errors';
import { InspectionStatus } from '../enums';
import styles from './inspectionWorkspace.module.css';

export function RentalApplicationActions({ inspectionId, status, feedback, application, occupancyId, onUpdated }: { inspectionId: string; status: InspectionStatus; feedback?: { outcome: string } | null; application?: { id: string; status: string } | null; occupancyId?: string; onUpdated: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canApply = status === InspectionStatus.COMPLETED && ['INTERESTED', 'NEEDS_FOLLOW_UP'].includes(feedback?.outcome ?? '') && !application && !occupancyId;
  async function submit(form: FormData) {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { setMessage(WEB_ERROR_MESSAGES.rentalApplicationSignInRequired); return; }
    setBusy(true);
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.rentalApplications}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ inspectionId, ...(form.get('moveInDate') ? { moveInDate: new Date(String(form.get('moveInDate'))).toISOString() } : {}), ...(form.get('studentMessage') ? { studentMessage: String(form.get('studentMessage')).trim() } : {}) }) });
      if (!response.ok) throw new Error(WEB_ERROR_MESSAGES.rentalApplicationSubmitFailed);
      setMessage('Application sent to the landlord.'); onUpdated();
    } catch (error) { setMessage(error instanceof Error ? error.message : WEB_ERROR_MESSAGES.rentalApplicationSubmitFailed); }
    finally { setBusy(false); }
  }
  if (!canApply) return application ? <p>Your application is {application.status.toLowerCase().replaceAll('_', ' ')}. <a href="/applications">View applications</a></p> : null;
  return <div className={styles.lifecycle}><p>Ready to apply after your visit?</p><form action={submit}><label>Preferred move-in date<input type="date" name="moveInDate" /></label><label>Note to landlord<textarea name="studentMessage" maxLength={1500} placeholder="Introduce yourself and share anything relevant to your application." /></label><button disabled={busy}>{busy ? 'Sending…' : 'Apply for this home'}</button></form>{message && <small role="status">{message}</small>}</div>;
}
