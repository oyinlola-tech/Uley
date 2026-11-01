import type { ReactNode } from 'react';
import { SiteFooter } from './siteFooter';
import { SiteHeader } from './siteHeader';

export function ProductGuideFrame({ children }: { children: ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
