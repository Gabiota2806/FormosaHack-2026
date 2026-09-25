import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from './services/api';
import type { ChatAnalysisResponse } from './types';
import App from './App';
import { CONTENTION, PREVENTION_TEXT, WELCOME_TEXT } from './components/chat/scripts';

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

describe('App: landing y navegación', () => {
  beforeEach(() => {
    analyzeMessage.mockReset();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  const heroTitle = () => screen.queryByRole('heading', { level: 1, name: /frená la estafa/ });

  it('arranca en la landing con "Inicio" marcado', () => {
    render(<App />);

    expect(heroTitle()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('el logo vuelve a la landing desde otra sección', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Asistente' }));
    expect(heroTitle()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'CiberGuardián: ir al inicio' }));
    expect(heroTitle()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('el ítem "Inicio" vuelve a la landing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    await user.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(heroTitle()).toBeInTheDocument();
  });

  it('"Analizar mensaje sospechoso" abre el chat en el flujo de prevención', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Analizar mensaje sospechoso' }));

    expect(screen.getByRole('button', { name: 'Asistente' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByText(PREVENTION_TEXT)).toBeInTheDocument();
  });

  it('el momento "Durante" abre el chat en la contención', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Qué hago ahora' }));
    expect(await screen.findByText(CONTENTION.title)).toBeInTheDocument();
  });

  it('el SOS de la landing abre el protocolo de auxilio', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Protocolo de auxilio SOS' }));
    expect(screen.getByRole('dialog', { name: /Protocolo de Auxilio/ })).toBeInTheDocument();
  });

  it('no repite el momento de entrada al volver al chat desde otra sección', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Analizar mensaje sospechoso' }));
    await screen.findByText(PREVENTION_TEXT);

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    await user.click(screen.getByRole('button', { name: 'Asistente' }));

    expect(screen.getByText(WELCOME_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(PREVENTION_TEXT)).not.toBeInTheDocument();
  });

  it('con StrictMode la respuesta del momento de entrada sale una sola vez', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: 'Qué hago ahora' }));
    await screen.findByText(CONTENTION.title);
    await waitFor(() => expect(screen.queryByLabelText('CiberGuardián está escribiendo')).not.toBeInTheDocument());
    expect(screen.getAllByText(CONTENTION.title)).toHaveLength(1);
  });
});
