import { PhoneCall, Copy, Lock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { buttonClasses } from '../ui/buttonClasses';
import { IconBadge } from '../ui/IconBadge';
import { cn } from '../ui/cn';
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
        className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-900 space-y-1"
      >
        <span className="font-bold flex items-center gap-1.5 text-red-700">
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
            className={cn(
              'p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
              c.highlight
                ? 'bg-red-50/60 border-red-200 hover:border-red-400'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="min-w-0 flex items-start gap-3">
              <IconBadge icon={Building2} tone={c.highlight ? 'danger' : 'brand'} />
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                <span className="text-sm font-mono font-bold text-slate-700 mt-1 block">{c.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                icon={Copy}
                onClick={() => handleCopyPhone(c.name, c.phone)}
                aria-label={`Copiar número de ${c.name}`}
                title="Copiar número"
                className="min-h-11 min-w-11 px-3"
              />
              <a
                href={toTelHref(c.phone)}
                aria-label={`Llamar a ${c.name} al ${c.phone}`}
                className={buttonClasses({
                  variant: c.highlight ? 'danger' : 'primary',
                  className: 'flex-1 sm:flex-none min-h-11 gap-2 text-xs uppercase tracking-wider font-bold',
                })}
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
