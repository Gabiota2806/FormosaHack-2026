import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  // Acción principal: verde de marca con texto oscuro (contraste AA).
  primary: 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-md shadow-brand-500/25',
  // Acción secundaria, pensada para usarse sobre tarjetas claras.
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/25',
  // Acción discreta sobre fondos oscuros.
  ghost: 'text-slate-300 hover:text-white hover:bg-slate-700',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  icon: 'h-12 w-12 rounded-2xl',
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  icon: 'w-5 h-5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícono de Lucide a la izquierda del texto (o único contenido con size="icon"). */
  icon?: LucideIcon;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold transition active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={cn('shrink-0', ICON_SIZES[size])} aria-hidden="true" />}
      {children}
    </button>
  );
}
