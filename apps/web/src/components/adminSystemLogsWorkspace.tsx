'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { SYSTEM_LOG_EVENT_FILTERS, SYSTEM_LOG_LEVEL_FILTERS, SYSTEM_LOG_PAGE_SIZE, ADMIN_SYSTEM_LOG_COPY, WEB_API_BASE_PATH, WEB_API_ENDPOINTS } from '../constants';
import { WEB_AUTH_STORAGE_KEYS } from '../constants/authStorage.constant';
import { WEB_ERROR_MESSAGES } from '../errors';
import type { AdminSystemLogResponse } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import styles from './adminSystemLogsWorkspace.module.css';

export function AdminSystemLogsWorkspace() {
  const [result, setResult] = useState<AdminSystemLogResponse | null>(null);
  const [filters, setFilters] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async (query: string, pageNumber: number) => {
    setLoading(true); setError('');
    try {
      const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
      if (!token) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
      const parameters = new URLSearchParams(query);
      parameters.set('page', String(pageNumber));
      parameters.set('pageSize', String(SYSTEM_LOG_PAGE_SIZE));
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.adminSystemLogs}?${parameters}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      const payload = await response.json() as AdminSystemLogResponse | { error?: { message?: string }; requestId?: string };
      if (!response.ok) throw new Error('error' in payload ? `${payload.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry}${payload.requestId ? ` · Ref ${payload.requestId}` : ''}` : WEB_ERROR_MESSAGES.requestFailedPleaseRetry);
      setResult(payload as AdminSystemLogResponse);
    } catch (failure) { setError(failure instanceof Error ? failure.message : WEB_ERROR_MESSAGES.requestFailedPleaseRetry); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLogs(filters, page); }, [filters, page, loadLogs]);

  function applyLogFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const key of ['search', 'level', 'eventType']) {
      const value = String(values.get(key) ?? '').trim();
      if (value) query.set(key, value);
    }
    setPage(1); setFilters(query.toString());
  }

  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/logs" /><section className={styles.heading}><div><p>{ADMIN_SYSTEM_LOG_COPY.eyebrow}</p><h1>{ADMIN_SYSTEM_LOG_COPY.title}</h1><small>{ADMIN_SYSTEM_LOG_COPY.description}</small></div><button onClick={() => void loadLogs(filters, page)}>{ADMIN_SYSTEM_LOG_COPY.refresh}</button></section>
    <form key={filters} className={styles.filters} onSubmit={applyLogFilters}><label>{ADMIN_SYSTEM_LOG_COPY.searchLabel}<input name="search" defaultValue={new URLSearchParams(filters).get('search') ?? ''} placeholder={ADMIN_SYSTEM_LOG_COPY.searchPlaceholder} /></label><label>{ADMIN_SYSTEM_LOG_COPY.levelLabel}<select name="level" defaultValue={new URLSearchParams(filters).get('level') ?? ''}><option value="">{ADMIN_SYSTEM_LOG_COPY.allLevels}</option>{SYSTEM_LOG_LEVEL_FILTERS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>{ADMIN_SYSTEM_LOG_COPY.eventLabel}<select name="eventType" defaultValue={new URLSearchParams(filters).get('eventType') ?? ''}><option value="">{ADMIN_SYSTEM_LOG_COPY.allEvents}</option>{SYSTEM_LOG_EVENT_FILTERS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button>{ADMIN_SYSTEM_LOG_COPY.applyFilters}</button></form>
    <section className={styles.results}><div className={styles.resultsHeading}><h2>{ADMIN_SYSTEM_LOG_COPY.timeline}</h2><span>{result?.pagination.totalCount ?? 0} {ADMIN_SYSTEM_LOG_COPY.matchingEvents}</span></div>{error && <p className={styles.error} role="alert">{error}</p>}{loading && <p className={styles.empty}>{ADMIN_SYSTEM_LOG_COPY.loading}</p>}{!loading && !error && result?.logs.length === 0 && <p className={styles.empty}>{ADMIN_SYSTEM_LOG_COPY.noResults}</p>}
      {!loading && result?.logs.map((log) => <article className={styles.entry} key={log.id}><div className={styles.event}><span className={`${styles.level} ${styles[log.level.toLowerCase()] ?? ''}`}>{log.level}</span><strong>{log.eventType.replaceAll('_', ' ')}</strong><time dateTime={log.occurredAt}>{new Date(log.occurredAt).toLocaleString()}</time></div><p>{log.summary}</p><div className={styles.details}><span>{log.actor ? `${log.actor.fullName} · ${log.actor.role.replaceAll('_', ' ')}` : ADMIN_SYSTEM_LOG_COPY.unauthenticated}</span><span>{log.method && log.route ? `${log.method} ${log.route}` : 'Application event'}{log.statusCode ? ` · ${log.statusCode}` : ''}</span>{log.errorCode && <span>Error: {log.errorCode}</span>}{log.targetType && <span>Target: {log.targetType} {log.targetId}</span>}</div>{log.requestId && <p className={styles.requestId}>Request ID <code>{log.requestId}</code></p>}{Boolean(log.metadata) && <details><summary>{ADMIN_SYSTEM_LOG_COPY.actionContext}</summary><pre>{JSON.stringify(log.metadata, null, 2)}</pre></details>}</article>)}
      {result && result.pagination.totalPages > 1 && <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>{ADMIN_SYSTEM_LOG_COPY.previous}</button><span>Page {page} of {result.pagination.totalPages}</span><button disabled={page >= result.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>{ADMIN_SYSTEM_LOG_COPY.next}</button></div>}
    </section>
  </main>;
}
