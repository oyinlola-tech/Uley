'use client';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_ENDPOINTS } from '../constants';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage } from '../errors';
import type { AdminAccount } from '../models';
import { AdminConsoleHeader } from './adminConsoleHeader';
import { requestAdminWorkspaceApi } from './adminWorkspaceApi';
import styles from './adminConsole.module.css';

export function AdminAccountWorkspace() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const loadAccounts = useCallback(async () => {
    try { setAccounts((await requestAdminWorkspaceApi<{ accounts: AdminAccount[] }>(WEB_API_ENDPOINTS.adminAccounts)).accounts); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.adminDashboardUnavailable)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadAccounts(); }, [loadAccounts]);
  async function changeStatus(account: AdminAccount, formData: FormData) {
    setError(''); setNotice('');
    const reason = String(formData.get('reason') ?? '').trim();
    try { await requestAdminWorkspaceApi(`${WEB_API_ENDPOINTS.adminAccounts}/${account.id}${WEB_API_ENDPOINTS.adminAccountStatusAction}`, { isActive: !account.isActive, reason }); setNotice(`${account.fullName}’s account is now ${account.isActive ? 'suspended' : 'active'}.`); await loadAccounts(); }
    catch (failure) { setError(getUserFacingErrorMessage(failure, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }
  return <main className={styles.page}><AdminConsoleHeader activePath="/admin/accounts" /><section className={styles.heading}><div><p>ACCOUNT DIRECTORY</p><h1>People using Uley.</h1><small>Latest 50 students, landlords, and caretakers. Every suspension and reactivation requires a reason and is recorded in the admin activity log.</small></div></section>{error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}{loading ? <p className={styles.empty}>Loading accounts…</p> : <section className={styles.cardList}>{accounts.length === 0 ? <p className={styles.empty}>No accounts to display.</p> : accounts.map((account) => <article className={styles.record} key={account.id}><div><span className={styles.status}>{account.role.replaceAll('_', ' ')}</span><h3>{account.fullName}</h3><p>{account.email}</p><small>Joined {new Date(account.createdAt).toLocaleDateString()} · {account.isActive ? 'Active' : 'Suspended'}</small></div><form action={async (data) => changeStatus(account, data)}><label>Reason for access change<input name="reason" minLength={10} maxLength={500} required placeholder="Record the reason for this action" /></label><div className={styles.actions}><button className={account.isActive ? styles.danger : styles.secondary}>{account.isActive ? 'Suspend account' : 'Reactivate account'}</button></div></form></article>)}</section>}</main>;
}
