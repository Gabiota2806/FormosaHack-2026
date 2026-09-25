import { useEffect, useRef } from 'react';
import { ArrowLeft, Building2, PhoneCall, Siren, type LucideIcon } from 'lucide-react';
import { EMERGENCY_CONTACTS, toTelHref } from '../sos/emergencyContacts';
import { cn } from '../ui/cn';

// Mismos números que el SOS (emergencyContacts.ts): así no quedan desincronizados.
function findPhone(match: (name: string) => boolean): string {
  const contact = EMERGENCY_CONTACTS.find((c) => match(c.name));
  if (!contact) throw new Error('Falta un contacto de emergencia del Modo Abuelo en EMERGENCY_CONTACTS');
  return contact.phone;
}

const CALLS: { name: string; label: string; phone: string; icon: LucideIcon; className: string }[] = [
  {
    name: 'Banco Formosa',
    label: 'Llamar al Banco Formosa',
    phone: findPhone((name) => name.startsWith('Banco Formosa')),
    icon: Building2,
    className: 'bg-white text-red-800 hover:bg-red-50 focus-visible:outline-white',
  },
  {
    name: 'Policía',
    label: 'Llamar a la Policía',
    phone: findPhone((name) => name.startsWith('Policía')),
    icon: Siren,
    className: 'bg-slate-950 text-white border-2 border-white/60 hover:bg-slate-900 focus-visible:outline-white',
  },
];

const STEPS = [
  'Cortá. No hace falta despedirte.',
  'No des claves, códigos ni el token. Nunca.',
  'Llamá vos al banco con los botones de arriba.',
];

/** Protocolo antipánico del Modo Abuelo: qué hacer durante una llamada sospechosa. */
export function ElderlyPanicScreen({ onBack }: { onBack: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Arriba de todo y con el foco en el título: es lo primero que se ve y lo primero que lee un lector de pantalla.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="panic-title"
      className="mx-auto max-w-2xl space-y-5 rounded-3xl bg-red-600 p-4 text-white shadow-2xl shadow-red-950/40 sm:space-y-6 sm:p-8 animate-fade-up"
    >
      <div className="space-y-2">
        <h1
          id="panic-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-extrabold uppercase leading-tight sm:text-4xl focus:outline-none"
        >
          ¡Cortá la llamada ya!
        </h1>
        <p className="text-lg font-bold leading-snug sm:text-xl">Ningún banco te va a pedir tu clave por teléfono.</p>
      </div>

      <div className="space-y-3">
        {/* Primero las llamadas: es lo que hay que hacer ya, sin scrollear. */}
        {CALLS.map(({ name, label, phone, icon: Icon, className }) => (
          <a
            key={phone}
            href={toTelHref(phone)}
            aria-label={`${label} al ${phone}`}
            className={cn(
              'flex min-h-16 w-full items-center gap-4 rounded-3xl p-4 shadow-lg transition-colors max-sm:gap-3 focus-visible:outline-4 focus-visible:outline-offset-2',
              className,
            )}
          >
            {/* En celular sin ícono: en 320px no entraba el número completo al lado. */}
            <Icon className="h-8 w-8 shrink-0 max-sm:hidden" aria-hidden="true" />
            <span className="min-w-0 flex-1 break-words">
              <span className="block text-xl font-extrabold leading-tight">{name}</span>
              <span className="block whitespace-nowrap text-lg font-bold tabular-nums">{phone}</span>
            </span>
            <PhoneCall className="h-8 w-8 shrink-0 max-sm:hidden" aria-hidden="true" />
          </a>
        ))}
      </div>

      <ol className="space-y-2 text-base leading-snug sm:text-lg">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-red-800"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onBack}
        className="flex min-h-16 w-full items-center justify-center gap-2 rounded-3xl border-2 border-white/70 px-4 text-lg font-bold transition-colors hover:bg-white/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        Volver
      </button>
    </section>
  );
}
