import { ALargeSmall, Globe, MessageCircle, Radio, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconBadge } from '../ui/IconBadge';
import type { LandingProps } from './types';

interface Channel {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Solo canales que ya funcionan: la landing no promete nada que no esté en la app.
const CHANNELS: Channel[] = [
  {
    icon: Globe,
    title: 'Desde cualquier navegador',
    description: 'Entrá desde la compu o el celular, sin instalar nada ni crear una cuenta.',
  },
  {
    icon: Smartphone,
    title: 'Instalala en tu celular',
    description:
      'Agregala a la pantalla de inicio. En Android, compartí un mensaje de WhatsApp directo a CiberGuardián.',
  },
  {
    icon: MessageCircle,
    title: 'Consultá con tu familia',
    description: 'Con un toque le mandás el mensaje y el diagnóstico por WhatsApp a alguien de confianza.',
  },
  {
    icon: ALargeSmall,
    title: 'Modo Protector Mayor',
    description: 'Letra más grande y más contraste con un solo toque, pensado para los que más lo necesitan.',
  },
];

export function MultiChannelShowcase({ onAction }: LandingProps) {
  return (
    <section aria-labelledby="channels-title" className="grid gap-8 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <h2 id="channels-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Está donde lo necesitás
        </h2>
        <p className="text-slate-300">
          CiberGuardián vive en el lugar donde te llegan las estafas: tu celular, tu WhatsApp y tu navegador.
        </p>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Radio} tone="solid" size="md" />
            <h3 className="font-bold text-white">Radar comunitario</h3>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Mirá qué estafas están circulando en Formosa y avisá si a vos también te llegó: cada aviso protege a otra
            persona.
          </p>
          <Button variant="ghost" icon={Radio} onClick={() => onAction('RADAR')} className="mt-4 border border-slate-600">
            Ver el Radar
          </Button>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
        {CHANNELS.map(({ icon, title, description }) => (
          <li key={title} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
            <IconBadge icon={icon} tone="solid" size="md" />
            <h3 className="mt-4 font-bold text-white">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
