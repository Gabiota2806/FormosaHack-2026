import { Lock, MapPin, Radio, Search, ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import { Button } from '../ui/Button';
import type { LandingProps } from './types';

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Gratis y sin registro' },
  // Honesto con el historial anónimo (FH26-89): se guarda solo si la persona no lo desactiva.
  { icon: Lock, label: 'Vos decidís si guardamos tus consultas' },
  { icon: MapPin, label: 'Pensado para Formosa' },
];

/** Ilustración decorativa: un mensaje trucho con las trampas marcadas y el veredicto. */
function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -inset-6 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative rounded-[2rem] border border-slate-700 bg-slate-800 p-4 shadow-2xl shadow-black/40">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-700" />
        <div className="rounded-2xl rounded-bl-md bg-white p-3.5 text-sm leading-6 text-slate-800 shadow-lg">
          <span className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900">¡URGENTE!</span> Tu cuenta de{' '}
          <span className="rounded bg-teal-100 px-0.5 font-semibold text-teal-900">Banco Formosa</span> será bloqueada.
          Pasame el <span className="rounded bg-red-100 px-0.5 font-semibold text-red-900">código token</span> para
          evitarlo.
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg">
          <div className="flex flex-col gap-1 rounded-lg bg-slate-800 p-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px] shadow-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase text-red-700">Riesgo alto</p>
            <p className="text-xs text-slate-600">Ningún banco te pide el token por mensaje.</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-400 text-white shadow-xl shadow-brand-500/30">
        <ShieldAlert className="h-7 w-7" />
      </div>
    </div>
  );
}

export function HeroSection({ onAction }: LandingProps) {
  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-10 py-6 md:grid-cols-2 md:py-12 animate-fade-up">
      <div className="space-y-6">
        <h1 id="hero-title" className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Que no te engañen: <span className="text-brand-400">frená la estafa</span> antes de caer
        </h1>
        <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
          CiberGuardián revisa en segundos mensajes, links y llamadas sospechosas, te explica la trampa en palabras
          simples y te guía paso a paso si ya pasó algo.
        </p>

        <ul className="flex flex-wrap gap-2" aria-label="Por qué confiar">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-200"
            >
              <Icon className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button icon={Search} onClick={() => onAction('ANALYZE')} className="py-3">
            Analizar mensaje sospechoso
          </Button>
          <Button variant="danger" icon={Siren} onClick={() => onAction('SOS')} className="py-3">
            Protocolo de auxilio SOS
          </Button>
          <Button variant="ghost" icon={Radio} onClick={() => onAction('RADAR')} className="border border-slate-600 py-3">
            Explorar Radar de estafas
          </Button>
        </div>
      </div>

      <HeroIllustration />
    </section>
  );
}
