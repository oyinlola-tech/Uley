'use client';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_ENDPOINTS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminProperty } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminPropertyWorkspace() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadProperties = useCallback(async () => {
    try { setProperties((await requestAdminWorkspaceApi<{ properties: AdminProperty[] }>(WEB_API_ENDPOINTS.adminProperties)).properties); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadProperties(); }, [loadProperties]);
  async function changeStatus(property: AdminProperty, action: 'SUSPEND' | 'RESTORE', formData: FormData) {
    setError(''); setNotice('');
    try { await requestAdminWorkspaceApi(`${WEB_API_ENDPOINTS.adminProperties}/${property.id}${WEB_API_ENDPOINTS.adminPropertyStatusAction}`, { action, reason: String(formData.get('reason') ?? '').trim() }); setNotice(`${property.name} was ${action === 'SUSPEND' ? 'suspended' : 'restored'} and the action was recorded.`); await loadProperties(); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/properties" /><section className={styles.heading}><div><p>LISTING OVERSIGHT</p><h1>Manage published homes.</h1><small>Latest 50 recently updated homes. Suspending a listing removes it from public search. Restoring requires approved verification, an active landlord, and an available unit.</small></div></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}{loading ? <p className={styles.empty}>Loading property records…</p> : <section className={styles.cardList}>{properties.length === 0 ? <p className={styles.empty}>No properties to display.</p> : properties.map((property) => <article className={styles.record} key={property.id}><div><span className={styles.status}>{property.status.replaceAll('_', ' ')}</span><h3>{property.name}</h3><p>{property.city} · Landlord: {property.landlord.fullName}</p><small>Landlord {property.landlord.isActive ? 'active' : 'suspended'} · Verification {property.verification?.status ?? 'NOT SUBMITTED'} · {property.units.filter((unit) => unit.isAvailable).length} available unit(s)</small></div>{(property.status === 'PUBLISHED' || property.status === 'SUSPENDED') && <form action={async (data) => changeStatus(property, property.status === 'PUBLISHED' ? 'SUSPEND' : 'RESTORE', data)}><label>Reason for listing action<input name="reason" minLength={10} maxLength={500} required placeholder="Explain why the listing should change" /></label><div className={styles.actions}><button className={property.status === 'PUBLISHED' ? styles.danger : ''}>{property.status === 'PUBLISHED' ? 'Suspend listing' : 'Restore listing'}</button></div></form>}</article>)}</section>}</main>;
}
