'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_REALTIME_API_ORIGIN } from '../constants';
import { useWebSessionRole } from './useWebSessionRole';
import { AccountRole } from '../enums';
import { WEB_ERROR_MESSAGES } from '../errors';
import styles from './messagesWorkspace.module.css';

type Participant = { userId: string; user: { id: string; fullName: string; role: string } };
type Conversation = { id: string; type: string; subject?: string | null; property?: { name: string } | null; participants: Participant[]; messages: Message[] };
type Message = { id: string; senderId: string; body: string; moderationStatus: string; createdAt: string; moderationAppeal?: { id: string; status: string; reviewNote?: string | null } | null; sender: { id: string; fullName: string } };
export function MessagesWorkspace() {
  const role = useWebSessionRole();
  const query = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [appealReasons, setAppealReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const socketReference = useRef<WebSocket | null>(null);
  const loadConversations = useCallback(async () => {
    try { const result = await request<{ conversations: Conversation[] }>(WEB_API_ENDPOINTS.conversations); setConversations(result.conversations); }
    catch (failure) { setError(failure instanceof Error ? failure.message : WEB_ERROR_MESSAGES.requestFailedPleaseRetry); }
  }, []);
  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => {
    const conversationId = query.get('conversationId');
    if (conversationId) { setSelected(conversationId); return; }
    const propertyId = query.get('propertyId');
    if (!propertyId || role !== AccountRole.STUDENT) return;
    void request<{ conversation: Conversation }>(WEB_API_ENDPOINTS.conversations, { type: 'LANDLORD_STUDENT', propertyId }).then((result) => { setSelected(result.conversation.id); void loadConversations(); }).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to contact this landlord.'));
  }, [query, role, loadConversations]);
  const loadMessages = useCallback(async () => {
    if (!selected) return;
    try { const result = await request<{ messages: Message[] }>(`${WEB_API_ENDPOINTS.conversations}/${selected}${WEB_API_ENDPOINTS.conversationMessages}`); setMessages(result.messages); await request(`${WEB_API_ENDPOINTS.conversations}/${selected}${WEB_API_ENDPOINTS.conversationRead}`, {}); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load messages.'); }
  }, [selected]);
  useEffect(() => {
    if (!messages.some((message) => message.moderationAppeal?.status === 'PENDING')) return;
    const timer = window.setInterval(() => void loadMessages(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadMessages, messages]);
  useEffect(() => {
    void loadMessages();
    const accessToken = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    let shouldReconnect = true;
    let retryDelay = 1000;
    let reconnectTimer = 0;
    const connect = () => {
      const apiOrigin = WEB_REALTIME_API_ORIGIN || window.location.origin;
      const realtimeOrigin = apiOrigin.replace(/^http/, 'ws').replace(/\/+$/, '');
      const socket = new WebSocket(`${realtimeOrigin}${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.conversationRealtime}`);
      socketReference.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ type: 'AUTH', accessToken }));
      socket.onmessage = (event) => {
        const update = JSON.parse(String(event.data)) as { type: string; conversationId?: string };
        if (update.type === 'AUTHENTICATED') {
          setRealtimeConnected(true);
          retryDelay = 1000;
          if (selected) socket.send(JSON.stringify({ type: 'SUBSCRIBE', conversationId: selected }));
          void loadConversations();
          void loadMessages();
        }
        if (update.type === 'MESSAGE_AVAILABLE') { void loadConversations(); if (update.conversationId === selected) void loadMessages(); }
        if (update.type === 'SUBSCRIPTION_DENIED' && update.conversationId === selected) { setMessages([]); setSelected(''); void loadConversations(); }
      };
      socket.onclose = () => {
        setRealtimeConnected(false);
        if (shouldReconnect) { reconnectTimer = window.setTimeout(connect, retryDelay); retryDelay = Math.min(retryDelay * 2, 30_000); }
      };
      socket.onerror = () => socket.close();
    };
    connect();
    const fallbackRefresh = window.setInterval(() => {
      if (socketReference.current?.readyState !== WebSocket.OPEN) { void loadMessages(); void loadConversations(); }
    }, 15_000);
    return () => {
      shouldReconnect = false;
      window.clearTimeout(reconnectTimer);
      window.clearInterval(fallbackRefresh);
      socketReference.current?.close();
      socketReference.current = null;
      setRealtimeConnected(false);
    };
  }, [loadConversations, loadMessages, selected]);
  async function startSupport() {
    try { const result = await request<{ conversation: Conversation }>(WEB_API_ENDPOINTS.conversations, { type: 'SUPPORT' }); await loadConversations(); setSelected(result.conversation.id); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Support is unavailable.'); }
  }
  async function sendMessage(event: React.FormEvent) {
    event.preventDefault(); if (!draft.trim() || !selected) return;
    setBusy(true);
    try { await request(`${WEB_API_ENDPOINTS.conversations}/${selected}${WEB_API_ENDPOINTS.conversationMessages}`, { body: draft }); setDraft(''); await loadMessages(); await loadConversations(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to send message.'); }
    finally { setBusy(false); }
  }
  async function reportMessage(messageId: string) {
    await request(WEB_API_ENDPOINTS.contentReports, { messageId, reason: 'OTHER', details: 'Reported from conversation.' });
    setError('Report sent to the school safety team.');
  }
  async function appealMessage(messageId: string) {
    const reason = appealReasons[messageId]?.trim() ?? '';
    if (reason.length < 20) { setError('Explain why the message should be reviewed again (at least 20 characters).'); return; }
    try { await request(`${WEB_API_ENDPOINTS.conversations}/${selected}${WEB_API_ENDPOINTS.conversationMessages}/${messageId}${WEB_API_ENDPOINTS.conversationMessageAppealAction}`, { reason }); setError('Appeal sent to the safety team for an independent review.'); await loadMessages(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to submit the appeal.'); }
  }
  async function blockParticipant(userId: string) {
    await request(`${WEB_API_ENDPOINTS.userBlocks}/${userId}${WEB_API_ENDPOINTS.userBlockAction}`, {});
    setSelected(''); await loadConversations();
  }
  const active = conversations.find((item) => item.id === selected);
  const others = active?.participants.filter((item) => item.user.role !== 'SCHOOL_ADMIN' && item.user.role !== 'SUPER_ADMIN') ?? [];
  return <main className={styles.page}><header><p>PRIVATE, ACCOUNT-BOUND MESSAGES</p><h1>Keep housing conversations<br/><span>in one place.</span></h1><small>Only conversation participants can read messages. Potentially offensive text is held for school moderation before delivery.</small></header><div className={styles.actions}><button onClick={() => void startSupport()}>Contact school support</button><small role="status">{realtimeConnected ? 'Live updates connected' : 'Reconnecting · message history refreshes automatically'}</small></div>{error && <p className={styles.notice} role="status">{error}</p>}<div className={styles.layout}><aside aria-label="Conversations"><h2>Your conversations</h2>{conversations.map((item) => <button key={item.id} className={selected === item.id ? styles.selected : ''} onClick={() => setSelected(item.id)}><strong>{item.property?.name ?? item.subject ?? label(item.type)}</strong><small>{item.messages[0]?.body ?? 'Start a conversation'}</small></button>)}{!conversations.length && <p>No conversations yet. Start from a verified property or contact school support.</p>}</aside><section className={styles.thread}><div className={styles.threadHeader}><h2>{active?.property?.name ?? active?.subject ?? (active ? label(active.type) : 'Select a conversation')}</h2>{active && others.map(({ user }) => <button key={user.id} onClick={() => void blockParticipant(user.id)}>Block {user.fullName}</button>)}</div><div className={styles.messages}>{messages.map((message) => <article key={message.id} className={message.moderationStatus !== 'APPROVED' ? styles.pending : ''}><strong>{message.sender.fullName}</strong><p>{message.moderationStatus === 'REVIEW' ? 'Held for school review. Only you can see this message.' : message.moderationStatus === 'REJECTED' ? 'This message was not delivered after moderator review.' : message.body}</p><small>{new Date(message.createdAt).toLocaleString()}</small>{message.moderationStatus === 'REJECTED' && message.senderId === getUserId() && (!message.moderationAppeal ? <div><textarea aria-label="Why should this message be reviewed again?" minLength={20} maxLength={1000} value={appealReasons[message.id] ?? ''} onChange={(event) => setAppealReasons((current) => ({ ...current, [message.id]: event.target.value }))} placeholder="Explain why this decision may need another look"/><button onClick={() => void appealMessage(message.id)}>Appeal decision</button></div> : <small>{message.moderationAppeal.status === 'PENDING' ? 'Appeal waiting for review.' : message.moderationAppeal.status === 'OVERTURNED' ? 'Appeal accepted. Message delivered.' : `Decision upheld. ${message.moderationAppeal.reviewNote ?? ''}`}</small>)}{message.sender.id !== getUserId() && message.moderationStatus === 'APPROVED' && <button onClick={() => void reportMessage(message.id)}>Report</button>}</article>)}</div><form onSubmit={sendMessage}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={3000} placeholder="Write a clear, respectful message" disabled={!active} required/><button disabled={!active || busy || !draft.trim()}>{busy ? 'Sending…' : 'Send message'}</button></form></section></div></main>;
}
function label(type: string) { return type === 'LANDLORD_STUDENT' ? 'Landlord conversation' : type === 'FLATMATE' ? 'Flatmate discussion' : type === 'DIRECT' ? 'Direct conversation' : 'School support'; }
function getUserId() { try { const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken); const value = token?.split('.')[1]; if (!value) return ''; const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '='); return (JSON.parse(window.atob(normalized)) as { sub?: string }).sub ?? ''; } catch { return ''; } }
async function request<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
  if (!token) throw new Error(WEB_ERROR_MESSAGES.signInRequired);
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) throw new Error((result as { error?: { message?: string } } | null)?.error?.message ?? 'The request could not be completed.');
  return result as T;
}
