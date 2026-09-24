import { PhoneCall, Copy, Lock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { EMERGENCY_CONTACTS, toTelHref } from './emergencyContacts';

export function EmergencyCallsPanel() {
  const handleCopyPhone = async (name: string, phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success(`Número de ${name} copiado: ${phone}`);
    } catch {
      toast.error(`No pudimos copiar el número. Marcalo a mano: ${phone}`);
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="note"
        className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 space-y-1"
      >
        <span className="font-bold flex items-center gap-1.5 text-red-300">
          <Lock className="w-4 h-4" aria-hidden="true" /> Regla de Oro en Vivo:
        </span>
        <p>
          Si estás al teléfono con alguien que te pide ir al cajero, dictar un token o abrir una app:
          <strong> ¡CORTÁ LA LLAMADA INMEDIATAMENTE!</strong> Ninguna entidad oficial hace eso.
        </p>
      </div>

      <ul className="space-y-3" aria-label="Líneas oficiales de bloqueo y denuncia">
        {EMERGENCY_CONTACTS.map((c) => (
          <li
            key={c.name}
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              c.highlight
                ? 'bg-red-950/20 border-red-800/80 hover:border-red-600'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                {c.name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
              <span className="text-sm font-mono font-bold text-slate-300 mt-1 block">
                {c.phone}
              </span>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyPhone(c.name, c.phone)}
                aria-label={`Copiar número de ${c.name}`}
                title="Copiar número"
                className="min-h-11 min-w-11 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href={toTelHref(c.phone)}
                aria-label={`Llamar a ${c.name} al ${c.phone}`}
                className={`flex-1 sm:flex-none min-h-11 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                  c.highlight
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                }`}
              >
                <PhoneCall className="w-4 h-4" aria-hidden="true" />
                Llamar 1-Tap
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
