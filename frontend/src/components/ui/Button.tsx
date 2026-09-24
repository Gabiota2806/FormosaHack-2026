import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { buttonClasses, ICON_SIZES, type ButtonSize, type ButtonVariant } from './buttonClasses';
import { cn } from './cn';

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
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {Icon && <Icon className={cn('shrink-0', ICON_SIZES[size])} aria-hidden="true" />}
      {children}
    </button>
  );
}
