import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { incidentApi } from '../../services/api';
import type { IncidentStats } from '../../types';
import { LiveStatsBar } from './LiveStatsBar';
import { STATS_CACHE_KEY } from './useIncidentStats';

vi.mock('../../services/api', () => ({
  incidentApi: { getStats: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const getStats = vi.mocked(incidentApi.getStats);

const LIVE: IncidentStats = {
  total_incidents: 1520,
  total_votes: 262,
  verified_channels: 5,
  distinct_entities: 7,
  active_outbreaks_24h: 1,
};

const CACHED: IncidentStats = { ...LIVE, total_incidents: 900, active_outbreaks_24h: 0 };

const saveCache = (stats: IncidentStats, savedAt = '2026-09-24T21:00:00.000Z') =>
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ stats, savedAt }));

const region = () => screen.getByRole('region', { name: 'Pulso comunitario en Formosa' });

describe('LiveStatsBar', () => {
  beforeEach(() => {
    getStats.mockReset();
    vi.mocked(toast.error).mockClear();
    localStorage.clear();
  });

  it('muestra tarjetas de carga y después los datos en vivo en formato argentino', async () => {
    getStats.mockResolvedValue(LIVE);
    render(<LiveStatsBar />);

    expect(region()).toHaveAttribute('aria-busy', 'true');

    expect(await screen.findByText('En vivo')).toBeInTheDocument();
    expect(region()).toHaveAttribute('aria-busy', 'false');
    expect(within(region()).getByText('1.520')).toBeInTheDocument();
    expect(within(region()).getByText('Estafas reportadas')).toBeInTheDocument();
    expect(within(region()).getByText('262')).toBeInTheDocument();
  });

  it('guarda el último dato real para usarlo de respaldo', async () => {
    getStats.mockResolvedValue(LIVE);
    render(<LiveStatsBar />);
    await screen.findByText('En vivo');

    expect(JSON.parse(localStorage.getItem(STATS_CACHE_KEY)!).stats).toEqual(LIVE);
  });

  it('si la red tarda, muestra el último dato guardado y lo reemplaza al llegar el nuevo', async () => {
    saveCache(CACHED);
    let resolve!: (s: IncidentStats) => void;
    getStats.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LiveStatsBar />);

    expect(await screen.findByText(/Último dato disponible/)).toBeInTheDocument();
    expect(within(region()).getByText('900')).toBeInTheDocument();

    resolve(LIVE);
    expect(await screen.findByText('En vivo')).toBeInTheDocument();
    expect(within(region()).getByText('1.520')).toBeInTheDocument();
  });

  it('si falla y hay dato guardado, lo muestra aclarando que no es en vivo', async () => {
    saveCache(CACHED);
    getStats.mockRejectedValue(new Error('Network Error'));
    render(<LiveStatsBar />);

    expect(await screen.findByText(/Último dato disponible/)).toBeInTheDocument();
    expect(screen.queryByText('En vivo')).not.toBeInTheDocument();
  });

  it('si falla sin dato guardado, no inventa números y no muestra toasts de error', async () => {
    getStats.mockRejectedValue(new Error('Network Error'));
    render(<LiveStatsBar />);

    expect(await screen.findByText(/No pudimos cargar el pulso comunitario/)).toBeInTheDocument();
    expect(within(region()).queryByRole('list')).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('ignora un respaldo guardado con datos corruptos', async () => {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ stats: { total_incidents: 'x' }, savedAt: 'ayer' }));
    getStats.mockRejectedValue(new Error('Network Error'));
    render(<LiveStatsBar />);

    expect(await screen.findByText(/No pudimos cargar el pulso comunitario/)).toBeInTheDocument();
  });

  it('destaca en rojo cuando hay brotes activos', async () => {
    getStats.mockResolvedValue(LIVE);
    render(<LiveStatsBar />);
    await screen.findByText('En vivo');

    expect(screen.getByText('Brotes activos (24 h)').closest('li')).toHaveClass('bg-red-600/15');
  });
});
