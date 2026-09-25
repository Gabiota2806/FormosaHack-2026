import { HeroSection } from './HeroSection';
import { LandingFooter } from './LandingFooter';
import { MultiChannelShowcase } from './MultiChannelShowcase';
import { ProtectionPillars } from './ProtectionPillars';
import type { LandingProps } from './types';

/** Portada completa. La barra de métricas en vivo (TASK-029) se suma entre el hero y los pilares. */
export function LandingPage({ onAction }: LandingProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-16 sm:space-y-20">
      <HeroSection onAction={onAction} />
      <ProtectionPillars onAction={onAction} />
      <MultiChannelShowcase onAction={onAction} />
      <LandingFooter />
    </div>
  );
}
