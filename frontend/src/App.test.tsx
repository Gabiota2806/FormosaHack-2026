import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from './services/api';
import type { ChatAnalysisResponse } from './types';
import App from './App';

vi.mock('./services/api', () => ({
  api: { post: vi.fn() },
  chatApi: { analyzeMessage: vi.fn() },
  incidentApi: {
    getIncidents: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 6,
      total_pages: 1,
      has_active_outbreak: false,
    }),
    voteIncident: vi.fn(),
  },
}));

const analyzeMessage = vi.mocked(chatApi.analyzeMessage);

const HIGH_RISK: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 90,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: intento de estafa.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [],
  wa_share_text: 'Hola, mirá esto.',
};

const SHARED = 'Banco Formosa: pasame el token urgente';

describe('App: mensaje compartido (Web Share Target)', () => {
  beforeEach(() => {
    analyzeMessage.mockReset();
    analyzeMessage.mockResolvedValue(HIGH_RISK);
    localStorage.clear();
    window.history.replaceState(null, '', `/?text=${encodeURIComponent(SHARED)}`);
  });

  it('analiza el mensaje compartido y limpia la URL', async () => {
    render(<App />);

    expect(await screen.findByText('ALERTA ROJA: intento de estafa.')).toBeInTheDocument();
    expect(analyzeMessage).toHaveBeenCalledExactlyOnceWith(SHARED);
    expect(window.location.search).toBe('');
  });

  it('no vuelve a analizarlo al ir a otra pestaña y volver al Asistente', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('ALERTA ROJA: intento de estafa.');

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    await user.click(screen.getByRole('button', { name: 'Asistente' }));

    expect(await screen.findByText(/Hola, soy CiberGuardián/)).toBeInTheDocument();
    expect(screen.queryByText(SHARED)).not.toBeInTheDocument();
    expect(analyzeMessage).toHaveBeenCalledTimes(1);
  });
});
