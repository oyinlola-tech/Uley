import {
  ForLandlordsSection,
  HeroSection,
  HowItWorksSection,
  PlatformTransparencySection,
  SiteFooter,
  SiteHeader,
  TrustPrinciplesSection,
} from '@/components';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <HeroSection />
        <TrustPrinciplesSection />
        <HowItWorksSection />
        <PlatformTransparencySection />
        <ForLandlordsSection />
      </main>
      <SiteFooter />
    </>
  );
}
