'use client';
import Link from 'next/link';
import { ADMIN_NAVIGATION_LINKS } from '../constants';
import { AccountRole } from '../enums';
import { useWebSessionRole } from './useWebSessionRole';
import styles from './adminConsole.module.css';

export function AdminConsoleHeader({ activePath }: { activePath: string }) {
  const role = useWebSessionRole();
  const isSuperAdmin = role === AccountRole.SUPER_ADMIN;
  const canModerateContent = [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN].includes(role as AccountRole);
  return <header className={styles.header}>{!role && <Link href="/admin" className={styles.brand}>uley <span>SCHOOL ADMIN</span></Link>}<nav aria-label="Admin workspace">{ADMIN_NAVIGATION_LINKS.filter(([href]) => (href !== '/admin/logs' || isSuperAdmin) && (href !== '/admin/chat-moderation' || canModerateContent) && (href !== '/admin/sponsored-campaigns' || canModerateContent) && (href !== '/admin/ads' || canModerateContent) && (href !== '/admin/complaints' || canModerateContent)).map(([href, label]) => <Link key={href} href={href} aria-current={activePath === href ? 'page' : undefined}>{label}</Link>)}</nav>{!role && <Link className={styles.publicLink} href="/listings">View public site ↗</Link>}</header>;
}
