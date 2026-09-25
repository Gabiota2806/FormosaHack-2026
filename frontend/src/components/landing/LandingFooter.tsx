import { PhoneCall, ShieldAlert, ShieldCheck } from 'lucide-react';
import { EMERGENCY_CONTACTS, toTelHref } from '../sos/emergencyContacts';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 pt-10 pb-4">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-brand-400 text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="text-white">Ciber</span>
              <span className="text-brand-400">Guardián</span>
            </span>
          </p>
          <p className="max-w-md text-sm text-slate-400">
            Asistente ciudadano para reconocer estafas digitales y pedir auxilio rápido. Hecho en Formosa para la
            FormosaHack 2026.
          </p>
          <p className="flex max-w-md items-start gap-1.5 text-xs text-slate-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Esto es una ayuda, no un veredicto. Ante la duda, no actúes y consultá los canales oficiales.
          </p>
        </div>

        <nav aria-labelledby="footer-emergency-title">
          <h2 id="footer-emergency-title" className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Líneas de emergencia 24 hs
          </h2>
          <ul className="mt-3 space-y-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <li key={c.name}>
                <a
                  href={toTelHref(c.phone)}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-400"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                    {c.name}
                  </span>
                  <span className="font-mono font-semibold">{c.phone}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
