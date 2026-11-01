import Link from 'next/link';
import styles from './uleyLogo.module.css';

type UleyLogoProps = {
  href: string;
  inverse?: boolean;
  label?: string;
  onClick?: () => void;
};

export function UleyLogo({ href, inverse = false, label = 'Uley home', onClick }: UleyLogoProps) {
  const logoTheme = inverse ? styles.inverse : '';
  const houseColor = inverse ? '#17243B' : '#fff';
  const doorColor = inverse ? '#2949D8' : '#F4CE54';

  return (
    <Link className={`${styles.logo} ${logoTheme}`} href={href} aria-label={label} onClick={onClick}>
      <svg className={styles.mark} viewBox="0 0 44 44" aria-hidden="true">
        <rect x="1" y="1" width="42" height="42" rx="13" fill={inverse ? '#F4CE54' : '#2949D8'} />
        <path d="m9 20 13-11 13 11M12 18v16h20V18" fill="none" stroke={houseColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 34v-9a4 4 0 0 1 8 0v9" fill="none" stroke={doorColor} strokeWidth="2.7" strokeLinecap="round" />
        <circle cx="32" cy="11" r="3" fill={doorColor} />
      </svg>
      <span className={styles.wordmark}>uley<span>.</span></span>
    </Link>
  );
}
