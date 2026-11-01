'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { AccountRole } from '../enums';
import { useWebSessionRole } from './useWebSessionRole';
import styles from './roommateProfileSearch.module.css';

type RoommateProfile = { id: string; fullName: string; university?: { name: string } | null; profile: { bio?: string | null; roommateCity?: string | null; roommateNeighborhood?: string | null; roommateBudget?: string | null; roommateRentalPeriod?: string | null } };

export function RoommateProfileSearch() {
  const role = useWebSessionRole(); const [profiles, setProfiles] = useState<RoommateProfile[]>([]); const [city, setCity] = useState(''); const [budget, setBudget] = useState(''); const [error, setError] = useState('');
  const search = useCallback(async () => {
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken); if (role !== AccountRole.STUDENT || !token) return;
    try {
      const query = new URLSearchParams(); if (city.trim()) query.set('city', city.trim()); if (budget) query.set('maximumBudget', budget);
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.profiles}?${query.toString()}`, { headers: { authorization: `Bearer ${token}` } });
      const result = await response.json() as { profiles?: RoommateProfile[]; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? 'Could not search roommate profiles.'); setProfiles(result.profiles ?? []); setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not search roommate profiles.'); }
  }, [role, city, budget]);
  useEffect(() => { void search(); }, [search]);
  if (role !== AccountRole.STUDENT) return null;
  return <section className={styles.section}><header><div><p>ROOMMATE SEARCH</p><h2>Meet students making similar plans.</h2><small>Only profiles set to discoverable and seeking a roommate appear here.</small></div></header><div className={styles.filters}><label>City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Any city"/></label><label>Maximum budget (₦)<input value={budget} onChange={(event) => setBudget(event.target.value)} type="number" min="1" placeholder="Any budget"/></label><button type="button" onClick={() => void search()}>Search profiles</button></div>{error && <p role="alert" className={styles.error}>{error}</p>}{profiles.length ? <div className={styles.grid}>{profiles.map((member) => <article key={member.id}><span>{member.profile.roommateCity}{member.profile.roommateNeighborhood ? ` · ${member.profile.roommateNeighborhood}` : ''}</span><h3>{member.fullName}</h3>{member.university && <small>{member.university.name}</small>}{member.profile.roommateBudget && <p>Up to ₦{Number(member.profile.roommateBudget).toLocaleString()} / {(member.profile.roommateRentalPeriod ?? 'YEAR').toLowerCase()}</p>}{member.profile.bio && <p>{member.profile.bio}</p>}<Link href={`/profiles/${member.id}`}>View profile and message →</Link></article>)}</div> : <p className={styles.empty}>No roommate profiles match yet. Try another city or budget.</p>}</section>;
}
