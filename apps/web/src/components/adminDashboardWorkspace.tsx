'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ADMIN_OVERVIEW_METRIC_LABELS, WEB_API_ENDPOINTS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminDashboardResponse } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminDashboardWorkspace() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loadDashboard = useCallback(async () => {
    try { setDashboard(await requestAdminWorkspaceApi<AdminDashboardResponse>(WEB_API_ENDPOINTS.adminDashboard)); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  const metrics = dashboard?.metrics;
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin" /><section className={styles.heading}><div><p>SCHOOL OPERATIONS · {dashboard?.administrator ?? 'ADMINISTRATOR'}</p><h1>Good day.<br />Here’s what needs attention.</h1><small>Live counts from Uley accounts, published homes, verification reviews, inspection requests, reports, and recent admin decisions.</small></div></section>
    {error && <p className={styles.error} role="alert">{error}</p>}{loading && <p className={styles.empty}>Loading platform activity…</p>}
    {metrics && <><section className={styles.metrics} aria-label="Platform totals">{ADMIN_OVERVIEW_METRIC_LABELS.map(([key, label, detail]) => <article className={styles.metric} key={key}><span>{label}</span><strong>{metrics[key].toLocaleString()}</strong><small>{detail}</small></article>)}</section>
      <section><div className={styles.sectionHeading}><h2>Work queues</h2><Link href="/admin/reviews">Open verification desk →</Link></div><div className={styles.workQueues}><QueueCard href="/admin/reviews" title="Landlord verification" count={metrics.pendingLandlords} detail="Accounts waiting for review" /><QueueCard href="/admin/reviews" title="Property verification" count={metrics.pendingProperties} detail="Listings waiting for review" /><QueueCard href="/admin/reports" title="Property reports" count={metrics.openReports} detail="Student reports needing action" /><QueueCard href="/admin/properties" title="Listing safety" count={metrics.suspendedProperties} detail="Suspended homes and listing controls" /><QueueCard href="/admin/inspections" title="Inspection requests" count={metrics.pendingInspections} detail="Visits awaiting landlord response" /><QueueCard href="/admin/accounts" title="Account directory" count={metrics.students + metrics.landlords} detail="Review student and landlord accounts" /></div></section>
      <section className={styles.activity}><div className={styles.sectionHeading}><h2>Recent admin actions</h2><span>Most recent 8</span></div>{dashboard.recentActions.length === 0 ? <p className={styles.empty}>No administrative actions have been recorded yet.</p> : <div className={styles.activityList}>{dashboard.recentActions.map((action) => <article className={styles.activityItem} key={action.id}><strong>{action.actionType.replaceAll('_', ' ')}</strong><span>{action.actor.fullName} · {action.reason}</span><time dateTime={action.createdAt}>{action.targetType} {action.targetId.slice(0, 8)} · {new Date(action.createdAt).toLocaleString()}</time></article>)}</div>}</section></>}
  </main>;
}

function QueueCard({ href, title, count, detail }: { href: string; title: string; count: number; detail: string }) {
  return <Link className={styles.queueCard} href={href}><span>{title}</span><strong>{count}</strong><small>{detail}</small></Link>;
}
