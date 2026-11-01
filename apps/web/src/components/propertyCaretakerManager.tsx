'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_PROPERTY_CARETAKER_COPY } from '../constants';
import { WEB_ERROR_MESSAGES } from '../errors';

type AssignedCaretaker = { assignedAt: string; caretaker: { id: string; fullName: string; email: string } };
export function PropertyCaretakerManager({ propertyId }: { propertyId: string }) {
  const [caretakers, setCaretakers] = useState<AssignedCaretaker[]>([]);
  const [emailAddress, setEmailAddress] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const endpoint = `${WEB_API_ENDPOINTS.landlordProperties}/${propertyId}${WEB_API_ENDPOINTS.landlordPropertyCaretakers}`;
  const refresh = useCallback(async () => {
    try { const result = await request<{ caretakers: AssignedCaretaker[] }>(endpoint); setCaretakers(result.caretakers); }
    catch (error) { setMessage(error instanceof Error ? error.message : WEB_ERROR_MESSAGES.caretakerListUnavailable); }
  }, [endpoint]);
  useEffect(() => { if (isOpen) void refresh(); }, [isOpen, refresh]);
  async function assign(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await request(endpoint, { emailAddress }, 'POST'); setEmailAddress(''); setMessage(WEB_PROPERTY_CARETAKER_COPY.assigned); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : WEB_ERROR_MESSAGES.caretakerAssignFailed); }
    finally { setBusy(false); }
  }
  async function remove(caretaker: AssignedCaretaker) {
    setBusy(true); setMessage('');
    try { await request(`${endpoint}/${caretaker.caretaker.id}`, undefined, 'DELETE'); setMessage(WEB_PROPERTY_CARETAKER_COPY.removed); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : WEB_ERROR_MESSAGES.caretakerRemoveFailed); }
    finally { setBusy(false); }
  }
  return <section aria-label="Property caretakers" style={{ marginTop: 18, padding: 16, border: '1px solid #dce5dc', borderRadius: 14, background: '#f7faf5' }}>
    <h4 style={{ margin: '0 0 6px', color: '#183c2c' }}>{WEB_PROPERTY_CARETAKER_COPY.heading}</h4>
    <p style={{ margin: '0 0 12px', color: '#617267', fontSize: 13 }}>{WEB_PROPERTY_CARETAKER_COPY.access}</p>
    <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>{isOpen ? 'Hide caretakers' : 'Manage caretakers'}</button>
    {isOpen && <>
    {caretakers.map((item) => <div key={item.caretaker.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '8px 0', borderTop: '1px solid #e4ebe3' }}><span><strong>{item.caretaker.fullName}</strong><br /><small>{item.caretaker.email}</small></span><button type="button" disabled={busy} onClick={() => void remove(item)}>{WEB_PROPERTY_CARETAKER_COPY.remove}</button></div>)}
    <form onSubmit={(event) => void assign(event)} style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><label style={{ flex: '1 1 220px' }}>{WEB_PROPERTY_CARETAKER_COPY.emailLabel}<input type="email" required value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} placeholder="caretaker@example.com" style={{ display: 'block', width: '100%', marginTop: 5, padding: 10 }} /></label><button disabled={busy || !emailAddress.includes('@')} style={{ alignSelf: 'end', padding: 11 }}>{busy ? WEB_PROPERTY_CARETAKER_COPY.assigning : WEB_PROPERTY_CARETAKER_COPY.assign}</button></form>
    {message && <p role="status" style={{ marginBottom: 0, color: '#42634d', fontSize: 13 }}>{message}</p>}
    </>}
  </section>;
}
async function request<T = unknown>(endpoint: string, body?: unknown, method: 'POST' | 'DELETE' = 'POST'): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error('Sign in to continue.');
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body === undefined ? method === 'POST' ? 'GET' : 'DELETE' : method, headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) throw new Error((payload as { error?: { message?: string } } | null)?.error?.message ?? 'Request failed.');
  return payload as T;
}
