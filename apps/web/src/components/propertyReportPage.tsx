'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_API_BASE_PATH, WEB_PROPERTY_REPORT_LABELS } from '../constants';
import { PropertyReportCategory } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import styles from './inspectionWorkspace.module.css';

export function PropertyReportPage() {
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setPropertyId(new URLSearchParams(window.location.search).get('propertyId') ?? ''); }, []);
  async function submitReport(formData: FormData) {
    setError(''); setNotice('');
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) { setError(WEB_ERROR_MESSAGES.signInRequired); return; }
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.propertyReports}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ propertyId, category: formData.get('category'), description: String(formData.get('description') ?? '').trim() }) });
      const result = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | null;
      if (!response.ok) throw new Error(getApiResponseErrorMessage(result?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, result?.requestId));
      setNotice(WEB_ERROR_MESSAGES.propertyReportSent);
    } catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><header><Link href="/listings">← Browse homes</Link><Link href={propertyId ? `/login?next=${encodeURIComponent(`/report-property?propertyId=${propertyId}`)}` : '/login'}>Sign in</Link></header><section className={styles.heading}><p>HELP KEEP LISTINGS HONEST</p><h1>Tell the school<br /><span>what needs attention.</span></h1><small>Share a clear, factual report about this property. The school team will review it.</small></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}<section className={styles.panel}><h2>Report a property</h2>{propertyId ? <form action={async (data) => submitReport(data)}><label>What is the issue?<select name="category" required>{Object.values(PropertyReportCategory).map((category) => <option key={category} value={category}>{WEB_PROPERTY_REPORT_LABELS[category]}</option>)}</select></label><label>Details<textarea name="description" minLength={20} maxLength={1500} required placeholder="Explain what happened, where, and when." /></label><button>Send report</button></form> : <p>Return to browse homes and open the report link for a listing.</p>}</section></main>;
}
