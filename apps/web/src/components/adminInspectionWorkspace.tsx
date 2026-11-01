'use client';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_ENDPOINTS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminInspection } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminInspectionWorkspace() {
  const [inspections, setInspections] = useState<AdminInspection[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loadInspections = useCallback(async () => {
    try { setInspections((await requestAdminWorkspaceApi<{ inspections: AdminInspection[] }>(WEB_API_ENDPOINTS.adminInspections)).inspections); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadInspections(); }, [loadInspections]);
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/inspections" /><section className={styles.heading}><div><p>STUDENT VISITS</p><h1>Inspection activity.</h1><small>Latest 50 requests sorted by status and requested visit time, with student, unit, property, and landlord details.</small></div></section>{error && <p className={styles.error} role="alert">{error}</p>}{loading ? <p className={styles.empty}>Loading inspection activity…</p> : inspections.length === 0 ? <p className={styles.empty}>There are no inspection requests yet.</p> : <section className={styles.cardList}>{inspections.map((inspection) => <article className={styles.record} key={inspection.id}><div><span className={styles.status}>{inspection.status.replaceAll('_', ' ')}</span><h3>{inspection.property.name} · {inspection.unit.name}</h3><p>{inspection.property.city} · Landlord {inspection.property.landlord.fullName}</p><small>Student {inspection.student.fullName} · {inspection.student.email}</small></div><div><h3>{new Date(inspection.scheduledFor).toLocaleString()}</h3><p>Rent ₦{Number(inspection.unit.rentAmount).toLocaleString()} per {inspection.unit.rentalPeriod.toLowerCase()}</p></div></article>)}</section>}</main>;
}
