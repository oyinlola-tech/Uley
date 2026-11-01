'use client';
import { useCallback, useEffect, useState } from 'react';
import { ADMIN_STAFF_ROLE_LABELS, WEB_API_ENDPOINTS } from '../constants';
import { CREATABLE_ADMIN_ACCOUNT_ROLES } from '../enums';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminStaffMember } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminStaffWorkspace() {
  const [staff, setStaff] = useState<AdminStaffMember[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadStaff = useCallback(async () => {
    try { setStaff((await requestAdminWorkspaceApi<{ staff: AdminStaffMember[] }>(WEB_API_ENDPOINTS.adminStaff)).staff); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadStaff(); }, [loadStaff]);
  async function createStaff(formData: FormData) {
    setError(''); setNotice('');
    try {
      await requestAdminWorkspaceApi(WEB_API_ENDPOINTS.adminStaff, { fullName: String(formData.get('fullName') ?? ''), email: String(formData.get('email') ?? ''), password: String(formData.get('password') ?? ''), role: String(formData.get('role') ?? '') });
      setNotice('Administrator account created. Share the temporary password securely and ask them to change it after signing in.');
      (document.getElementById('admin-staff-form') as HTMLFormElement | null)?.reset();
      await loadStaff();
    } catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  async function changeStatus(member: AdminStaffMember) {
    setError(''); setNotice('');
    try { await requestAdminWorkspaceApi(`${WEB_API_ENDPOINTS.adminStaff}/${member.id}${WEB_API_ENDPOINTS.adminStaffStatusAction}`, { isActive: !member.isActive }); setNotice(`${member.fullName} is now ${member.isActive ? 'suspended' : 'active'}.`); await loadStaff(); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/staff" /><section className={styles.heading}><div><p>SUPER ADMIN</p><h1>Administrator access.</h1><small>Create scoped staff accounts and suspend access when responsibilities change. New staff receive only the tools their role needs.</small></div></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}<section className={styles.record}><div><span className={styles.status}>CREATE STAFF</span><h3>Invite an administrator</h3><p>Use a unique 16 character temporary password and share it through a secure channel.</p></div><form id="admin-staff-form" action={createStaff}><label>Full name<input name="fullName" autoComplete="name" minLength={2} maxLength={160} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={320} required /></label><label>Role<select name="role" required>{CREATABLE_ADMIN_ACCOUNT_ROLES.map((role) => <option key={role} value={role}>{ADMIN_STAFF_ROLE_LABELS[role]}</option>)}</select></label><label>Temporary password<input name="password" type="password" autoComplete="new-password" minLength={16} maxLength={128} required /></label><div className={styles.actions}><button>Create administrator</button></div></form></section><section className={styles.staffList}><h2>Administrator accounts</h2>{loading ? <p className={styles.empty}>Loading administrator accounts…</p> : staff.map((member) => <article className={styles.record} key={member.id}><div><span className={styles.status}>{ADMIN_STAFF_ROLE_LABELS[member.role as keyof typeof ADMIN_STAFF_ROLE_LABELS] ?? member.role.replaceAll('_', ' ')}</span><h3>{member.fullName}</h3><p>{member.email}</p><small>{member.isActive ? 'Active' : 'Suspended'} · Created {new Date(member.createdAt).toLocaleDateString()}</small></div><div className={styles.actions}>{member.role !== 'SUPER_ADMIN' && <button className={member.isActive ? styles.danger : styles.secondary} onClick={() => void changeStatus(member)}>{member.isActive ? 'Suspend access' : 'Restore access'}</button>}</div></article>)}</section></main>;
}
