'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_RENTAL_APPLICATION_COPY } from '../constants';
import { WEB_ERROR_MESSAGES } from '../errors';
import styles from './inspectionWorkspace.module.css';
import type { RentalApplicationRecord } from '../models';
import { RentalApplicationStatus } from '../enums';

type WorkspaceRole = 'STUDENT' | 'LANDLORD';

export function RentalApplicationWorkspace({ role }: { role: WorkspaceRole }) {
  const [applications, setApplications] = useState<RentalApplicationRecord[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const isLandlord = role === 'LANDLORD';
  const endpoint = isLandlord ? WEB_API_ENDPOINTS.landlordRentalApplications : WEB_API_ENDPOINTS.rentalApplications;
  const refresh = useCallback(async () => {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { setError(WEB_ERROR_MESSAGES.rentalApplicationSignInRequired); return; }
    try {
      const response = await fetch(WEB_API_BASE_PATH + endpoint, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) throw new Error(WEB_ERROR_MESSAGES.rentalApplicationsUnavailable);
      setApplications(((await response.json()) as { applications: RentalApplicationRecord[] }).applications);
    } catch (failure) { setError(failure instanceof Error ? failure.message : WEB_ERROR_MESSAGES.rentalApplicationsUnavailable); }
  }, [endpoint]);
  useEffect(() => { void refresh(); }, [refresh]);
  async function act(applicationId: string, status: string, landlordResponse?: string) {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) return;
    setBusyId(applicationId); setError(''); setNotice('');
    try {
      const url = isLandlord
        ? `${WEB_API_ENDPOINTS.landlordRentalApplications}/${applicationId}${WEB_API_ENDPOINTS.rentalApplicationResponseAction}`
        : `${WEB_API_ENDPOINTS.rentalApplications}/${applicationId}${WEB_API_ENDPOINTS.rentalApplicationWithdrawAction}`;
      const response = await fetch(WEB_API_BASE_PATH + url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(isLandlord ? { status, ...(landlordResponse ? { landlordResponse } : {}) } : {}) });
      if (!response.ok) throw new Error(WEB_ERROR_MESSAGES.rentalApplicationUpdateFailed);
      setNotice(isLandlord ? status === 'APPROVED' ? WEB_RENTAL_APPLICATION_COPY.approved : status === 'DECLINED' ? WEB_RENTAL_APPLICATION_COPY.declined : WEB_RENTAL_APPLICATION_COPY.underReview : WEB_RENTAL_APPLICATION_COPY.withdrawn);
      await refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : WEB_ERROR_MESSAGES.rentalApplicationUpdateFailed); }
    finally { setBusyId(''); }
  }
  return <main className={styles.page}><header><Link href={isLandlord ? '/landlord' : '/inspections'}>← {isLandlord ? 'Landlord workspace' : 'Inspections'}</Link><Link href={isLandlord ? '/landlord/inspections' : '/listings'}>{isLandlord ? 'Inspection desk' : 'Browse homes'}</Link></header>
    <section className={styles.heading}><p>{isLandlord ? 'LANDLORD APPLICATION DESK' : 'YOUR HOME SEARCH'}</p><h1>{isLandlord ? WEB_RENTAL_APPLICATION_COPY.landlordHeading : WEB_RENTAL_APPLICATION_COPY.studentHeading}</h1><small>{isLandlord ? WEB_RENTAL_APPLICATION_COPY.landlordDescription : WEB_RENTAL_APPLICATION_COPY.studentDescription}</small></section>
    {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.requests}><h2>{isLandlord ? 'Applications for your homes' : 'Application history'}</h2>{applications.length === 0 ? <p className={styles.empty}>{isLandlord ? WEB_RENTAL_APPLICATION_COPY.landlordEmpty : WEB_RENTAL_APPLICATION_COPY.studentEmpty}</p> : applications.map((application) => <ApplicationCard key={application.id} application={application} role={role} busy={busyId === application.id} onAction={act} />)}</section>
  </main>;
}

function ApplicationCard({ application, role, busy, onAction }: { application: RentalApplicationRecord; role: WorkspaceRole; busy: boolean; onAction: (id: string, status: string, response?: string) => void }) {
  const [response, setResponse] = useState('');
  const isLandlord = role === 'LANDLORD';
  const canDecide = isLandlord && [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW].includes(application.status);
  const canWithdraw = !isLandlord && [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW].includes(application.status);
  return <article className={styles.card}><p className={styles.eyebrow}>{application.status.replaceAll('_', ' ')}</p><h3>{application.property.name} · {application.unit.name}</h3><p>{application.property.neighborhood}, {application.property.city} · {formatRent(application.unit.rentAmount, application.unit.rentalPeriod)}</p><p>Inspection: {new Date(application.inspection.scheduledFor).toLocaleString()}</p><p>Inspection fee: {formatNaira(application.unit.inspectionFee)} · Deposit: {formatNaira(application.unit.securityDeposit)}</p>{application.moveInDate && <p>Preferred move-in: {new Date(application.moveInDate).toLocaleDateString()}</p>}{isLandlord && <p>Applicant: {application.student.fullName} · {application.student.email}</p>}{application.studentMessage && <blockquote>{application.studentMessage}</blockquote>}{application.landlordResponse && <p>Landlord response: {application.landlordResponse}</p>}
    {canDecide && <div className={styles.lifecycle}><label>Message to student<textarea value={response} onChange={(event) => setResponse(event.target.value)} maxLength={1000} placeholder="Optional decision note" /></label><div className={styles.actions}><button disabled={busy} onClick={() => onAction(application.id, 'UNDER_REVIEW', response)}>Mark in review</button><button disabled={busy} onClick={() => onAction(application.id, 'APPROVED', response)}>Approve</button><button className={styles.secondary} disabled={busy} onClick={() => onAction(application.id, 'DECLINED', response)}>Decline</button></div></div>}
    {canWithdraw && <button className={styles.secondary} disabled={busy} onClick={() => onAction(application.id, 'WITHDRAWN')}>Withdraw application</button>}
  </article>;
}

function formatRent(amount: string, period: string) { const unit = period === 'YEAR' ? 'year' : period.toLowerCase(); return `${formatNaira(amount)} / ${unit}`; }
function formatNaira(amount: string) { return `₦${Number(amount).toLocaleString('en-NG')}`; }
