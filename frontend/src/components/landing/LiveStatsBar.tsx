import { BadgeCheck, Clock, Flame, ShieldAlert, Users, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IncidentStats } from '../../types';
import { IconBadge } from '../ui/IconBadge';
import { cn } from '../ui/cn';
import { useIncidentStats } from './useIncidentStats';

interface StatItem {
  key: keyof IncidentStats;
  label: string;
  icon: LucideIcon;
}

const STAT_ITEMS: StatItem[] = [
  { key: 'total_incidents', label: 'Estafas reportadas', icon: ShieldAlert },
  { key: 'total_votes', label: 'Avisos de la comunidad', icon: Users },
  { key: 'active_outbreaks_24h', label: 'Brotes activos (24 h)', icon: Flame },
  { key: 'verified_channels', label: 'Canales oficiales verificados', icon: BadgeCheck },
];

const numberFormat = new Intl.NumberFormat('es-AR');

const formatSavedAt = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

function StatCardSkeleton() {
  return (
    <li className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      <div className="h-8 w-8 rounded-full bg-slate-700 motion-safe:animate-pulse" />
      <div className="h-7 w-16 rounded bg-slate-700 motion-safe:animate-pulse" />
      <div className="h-3 w-28 rounded bg-slate-700/70 motion-safe:animate-pulse" />
    </li>
  );
}

/** Barra de pulso comunitario de la landing (FH26-65). */
export function LiveStatsBar() {
  const state = useIncidentStats();
  const loading = state.status === 'loading';

  return (
    <section aria-labelledby="stats-title" aria-busy={loading} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="stats-title" className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Pulso comunitario en Formosa
        </h2>
        {state.status === 'live' && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-400">
            <span className="h-2 w-2 rounded-full bg-brand-400 motion-safe:animate-pulse" aria-hidden="true" />
            En vivo
          </p>
        )}
        {state.status === 'cached' && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Último dato disponible · {formatSavedAt(state.savedAt)}
          </p>
        )}
      </div>

      {state.status === 'unavailable' ? (
        <p className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-300">
          <WifiOff className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          No pudimos cargar el pulso comunitario ahora. Probá de nuevo en un rato.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {loading
            ? STAT_ITEMS.map((s) => <StatCardSkeleton key={s.key} />)
            : STAT_ITEMS.map(({ key, label, icon }) => {
                const value = state.stats[key];
                const alert = key === 'active_outbreaks_24h' && value > 0;
                return (
                  <li
                    key={key}
                    className={cn(
                      'rounded-2xl border p-4 animate-fade-up',
                      alert ? 'border-red-500/50 bg-red-600/15' : 'border-slate-700 bg-slate-800/60',
                    )}
                  >
                    <IconBadge icon={icon} tone={alert ? 'danger' : 'solid'} />
                    <p className="mt-3 text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
                      {numberFormat.format(value)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">{label}</p>
                  </li>
                );
              })}
        </ul>
      )}
    </section>
  );
}
