'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import styles from './notificationFeed.module.css';

type Notification = { id: string; title: string; message: string; href?: string | null; readAt?: string | null; scheduledFor: string };
export function NotificationFeed() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const refresh = useCallback(async () => {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) return;
    const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.notifications}`, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const result = await response.json() as { notifications: Notification[]; unreadCount: number };
    setItems(result.notifications); setUnread(result.unreadCount);
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  async function markRead(id: string) {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) return;
    await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.notifications}/${id}/read`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    await refresh();
  }
  return <section className={styles.feed} aria-label="Notifications"><h2>Updates <span>{unread} unread</span></h2>{items.length ? items.slice(0, 5).map((item) => <article key={item.id} className={item.readAt ? '' : styles.unread}><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.scheduledFor).toLocaleString()}</small></div>{!item.readAt && <button onClick={() => void markRead(item.id)}>Mark read</button>}{item.href && <Link href={item.href}>Open</Link>}</article>) : <p>No updates yet. Visit reminders will show here.</p>}</section>;
}
