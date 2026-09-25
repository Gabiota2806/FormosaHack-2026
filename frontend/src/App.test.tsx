import { StrictMode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from './services/api';
import type { ChatAnalysisResponse } from './types';
import App from './App';
import { ElderlyModeProvider } from './components/elderly/ElderlyModeContext';
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
    getStats: vi.fn().mockResolvedValue({
      total_incidents: 10,
      total_votes: 262,
      verified_channels: 5,
      distinct_entities: 7,
      active_outbreaks_24h: 1,
    }),
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

const widgetPanel = () => screen.getByRole('dialog', { name: 'Asistente CiberGuardián', hidden: true });

const SHARED = 'Banco Formosa: pasame el token urgente';

describe('App: mensaje compartido (Web Share Target)', () => {
  beforeEach(() => {
    analyzeMessage.mockReset();
    analyzeMessage.mockResolvedValue(HIGH_RISK);
    localStorage.clear();
    window.history.replaceState(null, '', `/?text=${encodeURIComponent(SHARED)}`);
  });

  it('analiza el mensaje compartido y limpia la URL', async () => {
    render(<App />, { wrapper: ElderlyModeProvider });

    expect(await screen.findByText('ALERTA ROJA: intento de estafa.')).toBeInTheDocument();
    expect(analyzeMessage).toHaveBeenCalledExactlyOnceWith(SHARED);
    expect(window.location.search).toBe('');
  });

  it('abre el widget con el análisis y no lo repite al cambiar de sección', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });
    await screen.findByText('ALERTA ROJA: intento de estafa.');
    expect(widgetPanel()).not.toHaveAttribute('inert');

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    await user.click(screen.getByRole('button', { name: 'Inicio' }));

    // El widget conserva la conversación y no vuelve a pedir el análisis.
    expect(screen.getByText('ALERTA ROJA: intento de estafa.')).toBeInTheDocument();
    expect(analyzeMessage).toHaveBeenCalledTimes(1);
  });

  it('abre el chat y analiza automáticamente cuando llega el parámetro ?analyze de la extensión', async () => {
    const extensionUrl = 'https://bancoformosa-gestion.falsa.net';
    window.history.replaceState(null, '', `/?analyze=${encodeURIComponent(extensionUrl)}`);
    render(<App />, { wrapper: ElderlyModeProvider });

    expect(await screen.findByText('ALERTA ROJA: intento de estafa.')).toBeInTheDocument();
    expect(analyzeMessage).toHaveBeenCalledWith(extensionUrl);
    expect(window.location.search).toBe('');
  });

  it('con StrictMode analiza el mensaje compartido una sola vez', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
      { wrapper: ElderlyModeProvider },
    );

    await screen.findByText('ALERTA ROJA: intento de estafa.');
    expect(analyzeMessage).toHaveBeenCalledExactlyOnceWith(SHARED);
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
    render(<App />, { wrapper: ElderlyModeProvider });

    expect(heroTitle()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('el logo vuelve a la landing desde otra sección', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    expect(heroTitle()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'CiberGuardián: ir al inicio' }));
    expect(heroTitle()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('el ítem "Inicio" vuelve a la landing', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));
    await user.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(heroTitle()).toBeInTheDocument();
  });

  it('"Analizar mensaje sospechoso" abre el widget en el flujo de prevención sin salir de la landing', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Analizar mensaje sospechoso' }));

    expect(widgetPanel()).not.toHaveAttribute('inert');
    expect(await screen.findByText(PREVENTION_TEXT)).toBeInTheDocument();
    expect(heroTitle()).toBeInTheDocument();
  });

  it('el momento "Durante" abre el chat en la contención', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Qué hago ahora' }));
    expect(await screen.findByText(CONTENTION.title)).toBeInTheDocument();
  });

  it('el SOS de la landing abre el protocolo de auxilio', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Protocolo de auxilio SOS' }));
    expect(screen.getByRole('dialog', { name: /Protocolo de Auxilio/ })).toBeInTheDocument();
  });

  it('la conversación se conserva al cambiar de sección y el momento no se repite', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });
    await user.click(screen.getByRole('button', { name: 'Analizar mensaje sospechoso' }));
    await screen.findByText(PREVENTION_TEXT);

    await user.click(screen.getByRole('button', { name: 'Radar Comunitario' }));

    expect(screen.getByText(WELCOME_TEXT)).toBeInTheDocument();
    expect(screen.getAllByText(PREVENTION_TEXT)).toHaveLength(1);
  });

  it('no hay pestaña "Asistente": el chat es el widget, presente en todas las secciones', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });
    const nav = screen.getByRole('navigation', { name: 'Secciones' });

    expect(within(nav).queryByRole('button', { name: 'Asistente' })).not.toBeInTheDocument();
    for (const section of ['Radar Comunitario', '2FA & Auth', 'Inicio']) {
      await user.click(within(nav).getByRole('button', { name: section }));
      expect(screen.getByRole('button', { name: 'Abrir asistente CiberGuardián' })).toBeInTheDocument();
    }
  });

  it('"Advertir a la comunidad en el Radar" lleva al Radar y minimiza el widget', async () => {
    const user = userEvent.setup();
    analyzeMessage.mockResolvedValue(HIGH_RISK);
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: 'Analizar mensaje sospechoso' }));
    // Mientras el bot "escribe" la respuesta de prevención, el chat ignora envíos: esperarla.
    await screen.findByText(PREVENTION_TEXT);
    // paste en lugar de type: tipear tecla por tecla sobre la app entera es lento.
    await user.click(screen.getByLabelText('Mensaje sospechoso'));
    await user.paste(SHARED);
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Advertir a la comunidad en el Radar' }));

    expect(widgetPanel()).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Radar Comunitario' })).toHaveAttribute('aria-current', 'page');
  });

  it('con StrictMode la respuesta del momento de entrada sale una sola vez', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
      { wrapper: ElderlyModeProvider },
    );

    await user.click(screen.getByRole('button', { name: 'Qué hago ahora' }));
    await screen.findByText(CONTENTION.title);
    await waitFor(() => expect(screen.queryByLabelText('CiberGuardián está escribiendo')).not.toBeInTheDocument());
    expect(screen.getAllByText(CONTENTION.title)).toHaveLength(1);
  });
});

describe('App: Modo Abuelo', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('modo-abuelo');
    window.history.replaceState(null, '', '/');
  });

  it('oculta las pestañas técnicas y muestra el inicio de 3 botones', async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });
    const secciones = screen.getByRole('navigation', { name: 'Secciones' });

    expect(within(secciones).getByRole('button', { name: '2FA & Auth' })).toBeInTheDocument();
    expect(within(secciones).getByRole('button', { name: 'Radar Comunitario' })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Modo Abuelo / Simple' }));
    expect(within(secciones).queryByRole('button', { name: '2FA & Auth' })).not.toBeInTheDocument();
    expect(within(secciones).queryByRole('button', { name: 'Radar Comunitario' })).not.toBeInTheDocument();
    expect(within(secciones).getByRole('button', { name: /SOS/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¿En qué te ayudamos?' })).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Modo Abuelo / Simple' }));
    expect(screen.queryByRole('heading', { name: '¿En qué te ayudamos?' })).not.toBeInTheDocument();
  });

  it('"Pegar mensaje" abre el asistente para revisar un mensaje', async () => {
    localStorage.setItem('ciberguardian_modo_abuelo', 'true');
    const user = userEvent.setup();
    render(<App />, { wrapper: ElderlyModeProvider });

    await user.click(screen.getByRole('button', { name: /Pegar mensaje para revisar si es mentira/ }));
    expect(await screen.findByText(PREVENTION_TEXT)).toBeInTheDocument();
  });
});

describe('App: enlace profundo de notificaciones push (FH26-75)', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  const radarTab = () => screen.getByRole('button', { name: 'Radar Comunitario' });

  it('al abrir con "#radar?incident_id=15" va al Radar y limpia el hash', async () => {
    window.history.replaceState(null, '', '/#radar?incident_id=15');
    render(<App />, { wrapper: ElderlyModeProvider });

    expect(radarTab()).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(window.location.hash).toBe(''));
  });

  it('con la app abierta, la notificación (cambio de hash) lleva al Radar', async () => {
    render(<App />, { wrapper: ElderlyModeProvider });
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');

    window.history.replaceState(null, '', '/#radar?incident_id=3');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => expect(radarTab()).toHaveAttribute('aria-current', 'page'));
    expect(window.location.hash).toBe('');
  });

  it('ignora hashes que no son del Radar', async () => {
    render(<App />, { wrapper: ElderlyModeProvider });

    window.history.replaceState(null, '', '/#otra-cosa');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });
});
