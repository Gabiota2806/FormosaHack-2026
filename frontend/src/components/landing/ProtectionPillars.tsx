import { ArrowRight, PhoneCall, ShieldCheck, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import type { LandingAction, LandingProps } from './types';

interface Pillar {
  moment: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'brand' | 'danger';
  cta: string;
  action: LandingAction;
}

const PILLARS: Pillar[] = [
  {
    moment: 'Antes',
    title: 'Dudás de un mensaje o un link',
    description:
      'Pegalo y te mostramos las trampas marcadas en el mismo texto, con un semáforo de riesgo y qué conviene hacer.',
    icon: ShieldCheck,
    tone: 'brand',
    cta: 'Analizar mensaje',
    action: 'ANALYZE',
  },
  {
    moment: 'Durante',
    title: 'Te están llamando o apurando',
    description:
      'Cortá. Ningún banco te pide claves, tokens ni que vayas al cajero. Te damos 3 preguntas para darte cuenta al instante.',
    icon: PhoneCall,
    tone: 'brand',
    cta: 'Qué hago ahora',
    action: 'DURING_CALL',
  },
  {
    moment: 'Después',
    title: 'Pasaste datos o plata',
    description:
      'Bloqueá tus cuentas con un toque a las líneas 24 hs y armá la ficha de denuncia para presentar en la policía.',
    icon: Siren,
    tone: 'danger',
    cta: 'Abrir auxilio SOS',
    action: 'SOS',
  },
];

export function ProtectionPillars({ onAction }: LandingProps) {
  return (
    <section aria-labelledby="pillars-title" className="space-y-6">
      <div className="max-w-2xl">
        <h2 id="pillars-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Te acompañamos en los 3 momentos de una estafa
        </h2>
        <p className="mt-2 text-slate-300">
          Los estafadores no atacan computadoras: te apuran para que no pienses. Por eso te ayudamos antes, durante y
          después.
        </p>
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <li key={p.moment}>
            <Card className="flex h-full flex-col p-6 animate-fade-up">
              <IconBadge icon={p.icon} tone={p.tone} size="lg" />
              <p
                className={
                  p.tone === 'danger'
                    ? 'mt-4 text-xs font-bold uppercase tracking-wider text-red-600'
                    : 'mt-4 text-xs font-bold uppercase tracking-wider text-brand-700'
                }
              >
                {p.moment}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{p.description}</p>
              <Button
                variant={p.tone === 'danger' ? 'danger' : 'secondary'}
                onClick={() => onAction(p.action)}
                className="mt-5 self-start"
              >
                {p.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
