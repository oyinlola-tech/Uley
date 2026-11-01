'use client';

import Link from 'next/link';
import { ArrowRightIcon, HouseIcon, MapPinIcon } from '@phosphor-icons/react/ssr';
import { HTTP_ERROR_STATUS, type HttpErrorStatusCode, type HttpErrorStatusDetails } from '@/constants/httpErrorStatus.constant';
import { PUBLIC_ROUTES } from '@/constants';
import { SiteFooter } from '@/components/siteFooter';
import { SiteHeader } from '@/components/siteHeader';
import { StatusIllustration } from '@/components/statusIllustration';
import styles from './statusErrorPage.module.css';

export function StatusErrorPage({ code, onRetry }: { code: HttpErrorStatusCode; onRetry?: () => void }) {
  const status: HttpErrorStatusDetails = HTTP_ERROR_STATUS[code];
  const action = status.action && status.href ? <Link className={styles.primaryAction} href={status.href}>{status.action}<ArrowRightIcon size={18} weight="bold" aria-hidden="true" /></Link> : onRetry ? <button className={styles.primaryAction} onClick={onRetry}>Try again<ArrowRightIcon size={18} weight="bold" aria-hidden="true" /></button> : <Link className={styles.primaryAction} href="/">Find your way back<ArrowRightIcon size={18} weight="bold" aria-hidden="true" /></Link>;

  return <><SiteHeader /><main className={styles.page}><div className={styles.inner}>
    <div className={styles.layout}>
      <section className={styles.message} aria-labelledby="status-error-heading">
        <p className={styles.eyebrow}><MapPinIcon size={15} weight="fill" aria-hidden="true" /> {status.label}</p>
        <h1 id="status-error-heading">{status.title}</h1>
        <p className={styles.description}>{status.message}</p>
        <div className={styles.actions}>{action}<Link className={styles.secondaryAction} href={PUBLIC_ROUTES.studentGuide}><HouseIcon size={17} weight="duotone" aria-hidden="true" /> See how Uley works</Link></div>
      </section>
      <div className={styles.artwork}><StatusIllustration scene={status.scene} code={code} /></div>
    </div>
    <p className={styles.footerNote}>ULEY FIELD NOTE <span>·</span> STATUS {code}</p>
  </div></main><SiteFooter /></>;
}
