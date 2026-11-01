'use client';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { RentalPeriod, RENTAL_PERIOD_LABELS } from '../enums/rentalPeriod.enum';
import styles from './flatmateWorkspace.module.css';
import { RoommateProfileSearch } from './roommateProfileSearch';

type Post = { id: string; city: string; neighborhood?: string | null; budgetAmount: string; rentalPeriod: RentalPeriod; moveInDate?: string | null; description: string; student: { id: string; fullName: string } };
export function FlatmateWorkspace() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => { try { const result = await request<{ posts: Post[] }>(WEB_API_ENDPOINTS.flatmatePosts + (city ? `?city=${encodeURIComponent(city)}` : '')); setPosts(result.posts); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not load flatmate posts.'); } }, [city]);
  useEffect(() => { void load(); }, [load]);
  async function createPost(data: FormData) {
    setError('');
    try { await request(WEB_API_ENDPOINTS.flatmatePosts, { city: String(data.get('city')), neighborhood: String(data.get('neighborhood') ?? ''), budgetAmount: Number(data.get('budgetAmount')), rentalPeriod: String(data.get('rentalPeriod')), ...(data.get('moveInDate') ? { moveInDate: new Date(String(data.get('moveInDate'))).toISOString() } : {}), description: String(data.get('description')) }); setNotice('Your post is live. Keep replies on Uley and never share a payment code or password.'); await load(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to publish your post.'); }
  }
  async function contact(postId: string) {
    try { const result = await request<{ conversation: { id: string } }>(`${WEB_API_ENDPOINTS.flatmatePosts}/${postId}${WEB_API_ENDPOINTS.flatmateContact}`, {}); window.location.assign(`/messages?conversationId=${result.conversation.id}`); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to start a discussion.'); }
  }
  async function report(postId: string) { try { await request(WEB_API_ENDPOINTS.contentReports, { flatmatePostId: postId, reason: 'OTHER' }); setNotice('Report sent to the school safety team.'); } catch { setError('Unable to submit this report.'); } }
  return <main className={styles.page}><header><p>FIND PEOPLE BEFORE YOU SIGN</p><h1>Looking for a<br/><span>flatmate?</span></h1><small>Share your area, budget and move-in window. Message stays private between the people in the conversation.</small></header>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<section className={styles.create}><h2>Post what you’re looking for</h2><form action={createPost}><label>City<input name="city" required minLength={2} maxLength={100}/></label><label>Neighborhood, if you have one<input name="neighborhood" maxLength={120}/></label><label>Monthly or period budget (₦)<input name="budgetAmount" type="number" min="1" required/></label><label>Rent period<select name="rentalPeriod" defaultValue={RentalPeriod.MONTH}>{Object.values(RentalPeriod).map((value) => <option key={value} value={value}>{RENTAL_PERIOD_LABELS[value]}</option>)}</select></label><label>Move-in date<input name="moveInDate" type="date"/></label><label>What kind of flatmate or home are you looking for?<textarea name="description" minLength={30} maxLength={1500} required/></label><button>Publish flatmate post</button></form></section><RoommateProfileSearch /> <section className={styles.results}><div><h2>Student posts</h2><label>Filter by city<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Type a city"/></label></div>{posts.length ? posts.map((post) => <article key={post.id}><p className={styles.budget}>{post.city}{post.neighborhood ? ` · ${post.neighborhood}` : ''} · ₦{Number(post.budgetAmount).toLocaleString()} / {RENTAL_PERIOD_LABELS[post.rentalPeriod].toLowerCase()}</p><h3>{post.student.fullName}</h3>{post.moveInDate && <p>Moving around {new Date(post.moveInDate).toLocaleDateString()}</p>}<p>{post.description}</p><a href={`/profiles/${post.student.id}`}>View student profile</a><button onClick={() => void contact(post.id)}>Message this student</button><button className={styles.report} onClick={() => void report(post.id)}>Report post</button></article>) : <p>No active posts match that city yet.</p>}</section></main>;
}
async function request<T = unknown>(path: string, body?: unknown): Promise<T> { const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken); if (!token) throw new Error('Sign in to use the flatmate community.'); const response = await fetch(`${WEB_API_BASE_PATH}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) }); const result = await response.json().catch(() => null) as { error?: { message?: string } } | T | null; if (!response.ok) throw new Error((result as { error?: { message?: string } } | null)?.error?.message ?? 'The request failed.'); return result as T; }
