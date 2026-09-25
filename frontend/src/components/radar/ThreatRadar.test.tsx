import { AxiosError } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { incidentApi } from '../../services/api';
import type { IncidentItem, IncidentPaginationResponse } from '../../types';
import { ThreatRadar } from './ThreatRadar';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../services/api', () => ({
  incidentApi: {
    getIncidents: vi.fn(),
    voteIncident: vi.fn(),
  },
}));

const getIncidents = vi.mocked(incidentApi.getIncidents);
const voteIncident = vi.mocked(incidentApi.voteIncident);

const incident = (overrides: Partial<IncidentItem> = {}): IncidentItem => ({
  id: 1,
  title: 'Falso SMS de Banco Formosa',
  description: 'Piden actualizar datos en un link que imita al home banking.',
  impersonated_entity: 'Banco Formosa',
  attack_vector: 'WHATSAPP',
  votes_count: 1,
  status: 'ACTIVO',
  created_at: '2026-09-24T12:00:00Z',
  updated_at: '2026-09-24T12:00:00Z',
  ...overrides,
});

const pageOf = (
  items: IncidentItem[],
  overrides: Partial<IncidentPaginationResponse> = {},
): IncidentPaginationResponse => ({
  items,
  total: items.length,
  page: 1,
  limit: 6,
  total_pages: 1,
  has_active_outbreak: false,
  ...overrides,
});

const lastQuery = () => getIncidents.mock.lastCall?.[0];

describe('ThreatRadar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getIncidents.mockResolvedValue(pageOf([incident(), incident({ id: 2, title: 'Llamada falsa de ANSES', votes_count: 12 })]));
  });

  it('muestra las amenazas con canal legible, plural correcto y paginación', async () => {
    getIncidents.mockResolvedValue(
      pageOf([incident(), incident({ id: 2, title: 'Llamada falsa de ANSES', votes_count: 12 })], {
        total: 8,
        total_pages: 2,
      }),
    );
    render(<ThreatRadar />);

    expect(await screen.findByText('Falso SMS de Banco Formosa')).toBeInTheDocument();
    expect(screen.getAllByText('WhatsApp').length).toBeGreaterThan(0);
    expect(screen.getByText('1 persona lo recibió')).toBeInTheDocument();
    expect(screen.getByText('12 personas lo recibieron')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    expect(lastQuery()).toEqual({ page: 1, limit: 6, entity: undefined, vector: undefined, search: undefined });
  });

  it('filtra por entidad y canal pidiendo la página 1', async () => {
    const user = userEvent.setup();
    getIncidents.mockResolvedValue(pageOf([incident()], { total: 8, total_pages: 2 }));
    render(<ThreatRadar />);

    await user.click(await screen.findByRole('button', { name: /Siguiente/ }));
    await waitFor(() => expect(lastQuery()?.page).toBe(2));

    await user.selectOptions(screen.getByLabelText('Filtrar por entidad'), 'REFSA');
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 1, entity: 'REFSA' }));

    await user.selectOptions(screen.getByLabelText('Filtrar por canal de contacto'), 'SMS');
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 1, entity: 'REFSA', vector: 'SMS' }));
  });

  it('busca con debounce: un solo pedido al terminar de escribir', async () => {
    const user = userEvent.setup();
    render(<ThreatRadar />);
    await screen.findByText('Falso SMS de Banco Formosa');

    await user.type(screen.getByLabelText('Buscar amenazas'), 'anses');
    expect(getIncidents.mock.calls.some(([q]) => q?.search === 'anse')).toBe(false);

    await waitFor(() => expect(lastQuery()?.search).toBe('anses'));
    expect(getIncidents.mock.calls.filter(([q]) => q?.search).length).toBe(1);
  });

  it('vota una amenaza, actualiza el contador y recuerda el voto', async () => {
    const user = userEvent.setup();
    voteIncident.mockResolvedValue({ success: true, votes_count: 2, message: 'ok' });
    render(<ThreatRadar />);

    const voteBtn = await screen.findByRole('button', {
      name: 'A mí también me llegó: Falso SMS de Banco Formosa',
    });
    await user.click(voteBtn);

    expect(voteIncident).toHaveBeenCalledWith(1, expect.stringMatching(/^fp_[0-9a-f]{32}$/));
    expect(await screen.findByText('2 personas lo recibieron')).toBeInTheDocument();

    const votedBtn = screen.getByRole('button', { name: /Ya avisaste que te llegó: Falso SMS/ });
    expect(votedBtn).toBeDisabled();
    expect(votedBtn).toHaveAttribute('aria-pressed', 'true');
    expect(toast.success).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('radar_voted_ids') ?? '[]')).toEqual([1]);
  });

  it('marca como votada la amenaza si el backend ya tenía el voto de este dispositivo', async () => {
    const user = userEvent.setup();
    voteIncident.mockResolvedValue({
      success: false,
      votes_count: 7,
      message: 'Ya has validado este incidente anteriormente desde este dispositivo.',
    });
    render(<ThreatRadar />);

    await user.click(await screen.findByRole('button', { name: /A mí también me llegó: Falso SMS/ }));

    expect(toast.info).toHaveBeenCalledWith('Ya has validado este incidente anteriormente desde este dispositivo.');
    expect(await screen.findByText('7 personas lo recibieron')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ya avisaste que te llegó: Falso SMS/ })).toBeDisabled();
  });

  it('avisa con un toast si el voto falla por un error que no es de red', async () => {
    const user = userEvent.setup();
    voteIncident.mockRejectedValue(new TypeError('crypto.randomUUID is not a function'));
    render(<ThreatRadar />);

    await user.click(await screen.findByRole('button', { name: /A mí también me llegó: Falso SMS/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('No pudimos registrar tu aviso. Intentá de nuevo.'),
    );
    // El voto no se registró: el botón vuelve a quedar disponible.
    expect(screen.getByRole('button', { name: /A mí también me llegó: Falso SMS/ })).toBeEnabled();
  });

  it('no duplica el aviso cuando el error HTTP ya lo mostró el interceptor', async () => {
    const user = userEvent.setup();
    voteIncident.mockRejectedValue(new AxiosError('Network Error'));
    render(<ThreatRadar />);

    await user.click(await screen.findByRole('button', { name: /A mí también me llegó: Falso SMS/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /A mí también me llegó: Falso SMS/ })).toBeEnabled(),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('recuerda los votos guardados al recargar la página', async () => {
    localStorage.setItem('radar_voted_ids', JSON.stringify([2]));
    render(<ThreatRadar />);

    expect(await screen.findByRole('button', { name: /Ya avisaste que te llegó: Llamada falsa de ANSES/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /A mí también me llegó: Falso SMS/ })).toBeEnabled();
  });

  it('muestra un error con reintento cuando falla la carga', async () => {
    const user = userEvent.setup();
    getIncidents.mockRejectedValueOnce(new Error('Network Error'));
    render(<ThreatRadar />);

    expect(await screen.findByText(/No pudimos cargar el radar/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByText('Falso SMS de Banco Formosa')).toBeInTheDocument();
  });

  it('el botón del brote filtra por su entidad aunque no esté en la lista fija', async () => {
    const user = userEvent.setup();
    getIncidents.mockResolvedValue(
      pageOf([incident()], { has_active_outbreak: true, outbreak_entity: 'Naranja X' }),
    );
    render(<ThreatRadar />);

    await user.click(await screen.findByRole('button', { name: 'Filtrar este Brote' }));

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 1, entity: 'Naranja X' }));
    expect(screen.getByLabelText('Filtrar por entidad')).toHaveValue('Naranja X');
  });

  it('ofrece limpiar filtros cuando no hay resultados', async () => {
    const user = userEvent.setup();
    render(<ThreatRadar />);
    await screen.findByText('Falso SMS de Banco Formosa');

    getIncidents.mockResolvedValue(pageOf([]));
    await user.selectOptions(screen.getByLabelText('Filtrar por entidad'), 'ANSES');
    await user.click(await screen.findByRole('button', { name: /Limpiar filtros/ }));

    await waitFor(() => expect(lastQuery()).toMatchObject({ entity: undefined, page: 1 }));
    expect(screen.getByLabelText('Filtrar por entidad')).toHaveValue('');
  });
});
