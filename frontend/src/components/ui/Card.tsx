import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type CardTone = 'light' | 'dark';

const TONES: Record<CardTone, string> = {
  // Contenido principal: tarjeta blanca sobre el fondo oscuro de la app.
  light: 'bg-white text-slate-800 shadow-xl shadow-black/20',
  // Paneles y contenedores que se funden con el fondo.
  dark: 'bg-slate-800/60 text-slate-100 border border-slate-700/70 shadow-2xl shadow-black/30',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

export function Card({ tone = 'light', className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl overflow-hidden', TONES[tone], className)} {...props} />;
}
