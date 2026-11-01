'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WEB_API_ENDPOINTS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminPropertyReport } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminReportWorkspace() {
  const [reports, setReports] = useState<AdminPropertyReport[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadReports = useCallback(async () => {
    try { setReports((await requestAdminWorkspaceApi<{ reports: AdminPropertyReport[] }>(WEB_API_ENDPOINTS.adminReports)).reports); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadReports(); }, [loadReports]);
  async function submitReview(report: AdminPropertyReport, formData: FormData) {
    setError(''); setNotice('');
    const status = String(formData.get('status'));
    try { await requestAdminWorkspaceApi(`${WEB_API_ENDPOINTS.adminReports}/${report.id}${WEB_API_ENDPOINTS.adminReportReviewAction}`, { status, reason: String(formData.get('reason') ?? '').trim() }); setNotice(`Report for ${report.property.name} has been recorded.`); await loadReports(); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/reports" /><section className={styles.heading}><div><p>SAFETY REPORTS</p><h1>Review reported homes.</h1><small>Oldest 50 open reports appear first. Record a finding or dismiss a report with a reason; use listing controls if a home must be hidden.</small></div></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}{loading ? <p className={styles.empty}>Loading reports…</p> : reports.length === 0 ? <p className={styles.empty}>No property reports are waiting for review.</p> : <section className={styles.cardList}>{reports.map((report) => <article className={styles.record} key={report.id}><div><span className={styles.status}>{report.category.replaceAll('_', ' ')}</span><h3>{report.property.name} · {report.property.city}</h3><p>{report.description}</p><small>Reported by {report.reporter.fullName} ({report.reporter.email}) · {new Date(report.createdAt).toLocaleString()}</small><p><Link href="/admin/properties">Open listing controls →</Link></p></div><form action={async (data) => submitReview(report, data)}><label>Review note<input name="reason" minLength={10} maxLength={500} required placeholder="Record what was checked or found" /></label><div className={styles.actions}><button name="status" value="REVIEWED">Mark reviewed</button><button name="status" value="DISMISSED" className={styles.secondary}>Dismiss report</button></div></form></article>)}</section>}</main>;
}
