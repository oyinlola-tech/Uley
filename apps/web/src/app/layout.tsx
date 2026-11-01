import { THEME_PREFERENCE_STORAGE_KEY } from '../constants';
import type { Metadata } from 'next';

import { ThemePreference } from '../enums';
import './globals.css';
import { CookieNotice } from '../components/cookieNotice';
import { AuthenticatedAppChrome } from '../components/authenticatedAppChrome';

export const metadata: Metadata = {
  title: 'Uley — Find a place near campus with more clarity',
  description: 'Compare verified off-campus homes, request an inspection before applying, and know who to contact if something goes wrong.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { const saved = localStorage.getItem('${THEME_PREFERENCE_STORAGE_KEY}'); const theme = saved === '${ThemePreference.DARK}' || saved === '${ThemePreference.LIGHT}' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? '${ThemePreference.DARK}' : '${ThemePreference.LIGHT}'; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; } catch {}` }} />
      </head>
      <body><AuthenticatedAppChrome>{children}</AuthenticatedAppChrome><CookieNotice /></body>
    </html>
  );
}
