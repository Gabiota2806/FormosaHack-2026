import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

type IconBadgeTone = 'brand' | 'danger' | 'solid';
type IconBadgeSize = 'sm' | 'md' | 'lg';

const TONES: Record<IconBadgeTone, string> = {
  brand: 'bg-gradient-to-br from-sky-100 to-brand-100 text-sky-700',
  danger: 'bg-gradient-to-br from-red-100 to-orange-100 text-red-600',
  // Versión llena, para usar sobre fondos oscuros (logo, avatar del bot).
  solid: 'bg-gradient-to-br from-sky-500 to-brand-400 text-white shadow-md shadow-brand-500/20',
};

const SIZES: Record<IconBadgeSize, { box: string; icon: string }> = {
  sm: { box: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { box: 'w-11 h-11', icon: 'w-5 h-5' },
  lg: { box: 'w-16 h-16', icon: 'w-8 h-8' },
};

interface IconBadgeProps {
  icon: LucideIcon;
  tone?: IconBadgeTone;
  size?: IconBadgeSize;
  /** Por defecto `rounded-full`; pasar p. ej. `rounded-xl` para un cuadrado redondeado. */
  className?: string;
}

/** Ícono de Lucide dentro de un círculo con degradé (estilo "ilustrado" de la referencia). */
export function IconBadge({ icon: Icon, tone = 'brand', size = 'sm', className }: IconBadgeProps) {
  return (
    <span
      className={cn('shrink-0 rounded-full flex items-center justify-center', TONES[tone], SIZES[size].box, className)}
      aria-hidden="true"
    >
      <Icon className={SIZES[size].icon} />
    </span>
  );
}
