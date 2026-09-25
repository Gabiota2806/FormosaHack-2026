import { HeroSection } from './HeroSection';
import { LandingFooter } from './LandingFooter';
import { LiveStatsBar } from './LiveStatsBar';
import { MultiChannelShowcase } from './MultiChannelShowcase';
import { ProtectionPillars } from './ProtectionPillars';
import type { LandingProps } from './types';

/** Portada completa: hero, pulso comunitario en vivo, los 3 momentos, canales y pie. */
export function LandingPage({ onAction }: LandingProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-16 sm:space-y-20">
      <HeroSection onAction={onAction} />
      <LiveStatsBar />
      <ProtectionPillars onAction={onAction} />
      <MultiChannelShowcase onAction={onAction} />
      <LandingFooter />
    </div>
  );
}
