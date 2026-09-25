import { useEffect, useState } from 'react';
import axios from 'axios';
import { incidentApi } from '../../services/api';
import type { IncidentStats } from '../../types';

/** Si la red tarda más que esto, se muestra el último dato real guardado (si hay). */
export const STATS_FALLBACK_DELAY_MS = 500;
export const STATS_CACHE_KEY = 'landing_stats_cache';

export type StatsState =
  | { status: 'loading' }
  | { status: 'live'; stats: IncidentStats }
  | { status: 'cached'; stats: IncidentStats; savedAt: string }
  | { status: 'unavailable' };

interface CachedStats {
  stats: IncidentStats;
  savedAt: string;
}

const STAT_KEYS: (keyof IncidentStats)[] = [
  'total_incidents',
  'total_votes',
  'verified_channels',
  'distinct_entities',
  'active_outbreaks_24h',
];

const isStats = (value: unknown): value is IncidentStats =>
  typeof value === 'object' &&
  value !== null &&
  STAT_KEYS.every((k) => Number.isInteger((value as Record<string, unknown>)[k]));

function readCache(): CachedStats | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STATS_CACHE_KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { stats, savedAt } = parsed as { stats?: unknown; savedAt?: unknown };
    return typeof savedAt === 'string' && isStats(stats) ? { stats, savedAt } : null;
  } catch {
    return null;
  }
}

function writeCache(stats: IncidentStats) {
  try {
    const entry: CachedStats = { stats, savedAt: new Date().toISOString() };
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Sin persistencia: la próxima visita no tendrá respaldo, nada más.
  }
}

/**
 * Métricas del pulso comunitario. Nunca muestra números inventados: si la red tarda
 * o falla, usa el último dato real guardado en el navegador; si no hay, lo informa.
 */
export function useIncidentStats(): StatsState {
  const [state, setState] = useState<StatsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;

    const showCacheOr = (otherwise: StatsState | null) => {
      const cache = readCache();
      if (cache) setState({ status: 'cached', ...cache });
      else if (otherwise) setState(otherwise);
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!settled) showCacheOr(null);
    }, STATS_FALLBACK_DELAY_MS);

    incidentApi
      .getStats(controller.signal)
      .then((stats) => {
        settled = true;
        writeCache(stats);
        setState({ status: 'live', stats });
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        settled = true;
        showCacheOr({ status: 'unavailable' });
      })
      .finally(() => clearTimeout(fallbackTimer));

    return () => {
      controller.abort();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return state;
}
