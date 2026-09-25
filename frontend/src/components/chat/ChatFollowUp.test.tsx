import type { ReactElement } from 'react';
import { act, render as rtlRender, screen, waitFor, within, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse, ChatFollowupResponse } from '../../types';
import { ElderlyModeProvider } from '../elderly/ElderlyModeContext';
import { ChatAssistant } from './ChatAssistant';
import { getCategoryStyle } from './phraseCategories';
import { FOLLOWUP_ERROR_TEXT } from './scripts';

vi.mock('../../services/api', () => ({
  chatApi: { analyzeMessage: vi.fn(), followUp: vi.fn() },
}));

const render = (ui: ReactElement, options?: RenderOptions) => rtlRender(ui, { wrapper: ElderlyModeProvider, ...options });

const analyzeMessage = vi.mocked(chatApi.analyzeMessage);
const followUp = vi.mocked(chatApi.followUp);

const MESSAGE = 'Banco Formosa: pasame el token urgente';

const ANALYSIS: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 85,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: intento de estafa.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [],
  wa_share_text: '',
};

const ANSWER: ChatFollowupResponse = {
  answer: 'Tranquilo: si hiciste clic pero no cargaste datos, cerrá la página.',
  suggested_actions: ['Cerrá la página sin cargar nada', 'Cambiá la clave del home banking'],
  emergency_contacts: [
    { name: 'Banco Formosa', phone: '0800-777-2262', channel_type: 'PHONE' },
    { name: 'WhatsApp oficial', url: 'https://wa.me/5493704002262', channel_type: 'WHATSAPP' },
    { name: 'Denuncia online', url: 'https://denuncias.formosa.gob.ar', channel_type: 'WEB' },
    { name: 'Enlace roto', url: 'javascript:alert(1)', channel_type: 'WEB' },
  ],
  followup_suggestions: ['¿Cómo cambio la clave?'],
  is_fallback: false,
};

/** Analiza el mensaje y deja el chat en modo seguimiento. */
async function analyze(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Mensaje sospechoso'), `${MESSAGE}{Enter}`);
  await screen.findByText('ALERTA ROJA: intento de estafa.');
}

describe('ChatAssistant: preguntas de seguimiento (FH26-57)', () => {
  beforeEach(() => {
    analyzeMessage.mockReset();
    followUp.mockReset();
    analyzeMessage.mockResolvedValue(ANALYSIS);
    followUp.mockResolvedValue(ANSWER);
  });

  it('después del análisis ofrece preguntas y pasa la caja a modo pregunta', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    expect(screen.getByRole('button', { name: '¿Qué hago si ya hice clic en el enlace?' })).toBeInTheDocument();
    expect(screen.getByText('Preguntando sobre el mensaje analizado')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu pregunta sobre el mensaje')).toHaveAttribute(
      'placeholder',
      'Preguntá lo que quieras sobre este mensaje…',
    );
  });

  it('envía la pregunta con el diagnóstico, el mensaje original y la sesión', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    await user.click(screen.getByRole('button', { name: '¿Qué hago si ya hice clic en el enlace?' }));

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
    expect(followUp).toHaveBeenCalledExactlyOnceWith({
      question: '¿Qué hago si ya hice clic en el enlace?',
      context_diagnosis: ANALYSIS,
      initial_message: MESSAGE,
      history: [],
      session_key: expect.stringMatching(/^[0-9a-f]{24}$/),
    });
    expect(analyzeMessage).toHaveBeenCalledTimes(1);
  });

  it('acumula el hilo: la segunda pregunta lleva la primera como historial', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    await user.type(screen.getByLabelText('Tu pregunta sobre el mensaje'), '¿Y ahora qué hago?{Enter}');
    await screen.findByText(ANSWER.answer);
    await user.click(screen.getByRole('button', { name: '¿Cómo cambio la clave?' }));

    await waitFor(() => expect(followUp).toHaveBeenCalledTimes(2));
    const [first, second] = followUp.mock.calls.map(([req]) => req);
    expect(second.history).toEqual([
      { role: 'user', content: '¿Y ahora qué hago?' },
      { role: 'assistant', content: ANSWER.answer },
    ]);
    expect(second.session_key).toBe(first.session_key);
  });

  it('muestra los pasos y los contactos con enlaces seguros según el canal', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);
    await user.click(screen.getByRole('button', { name: '¿Cómo lo denuncio?' }));
    await screen.findByText(ANSWER.answer);

    expect(screen.getByText('Cambiá la clave del home banking')).toBeInTheDocument();
    const contacts = within(screen.getByRole('list', { name: 'Contactos de ayuda' }));
    expect(contacts.getByRole('link', { name: 'Llamar: Banco Formosa' })).toHaveAttribute('href', 'tel:08007772262');
    expect(contacts.getByRole('link', { name: 'WhatsApp: WhatsApp oficial' })).toHaveAttribute(
      'href',
      'https://wa.me/5493704002262',
    );
    expect(contacts.getByRole('link', { name: 'Abrir sitio: Denuncia online' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByText('Enlace roto')).not.toBeInTheDocument();
  });

  it('aclara cuando la respuesta es de respaldo', async () => {
    followUp.mockResolvedValue({ ...ANSWER, is_fallback: true });
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    await user.click(screen.getByRole('button', { name: '¿Cómo lo denuncio?' }));

    expect(await screen.findByText(/Respuesta automática de respaldo/)).toBeInTheDocument();
  });

  it('si falla, deja una guía en el chat', async () => {
    followUp.mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    await user.click(screen.getByRole('button', { name: '¿Cómo lo denuncio?' }));

    expect(await screen.findByText(FOLLOWUP_ERROR_TEXT)).toBeInTheDocument();
  });

  it('"Analizar otro mensaje" vuelve a analizar y arranca otra sesión de preguntas', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);
    await user.click(screen.getByRole('button', { name: '¿Cómo lo denuncio?' }));
    await screen.findByText(ANSWER.answer);

    await user.click(screen.getByRole('button', { name: 'Analizar otro mensaje' }));
    expect(screen.getByRole('button', { name: 'Seguir preguntando sobre el último mensaje' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Mensaje sospechoso'), 'Otro mensaje raro de ANSES{Enter}');
    await waitFor(() => expect(analyzeMessage).toHaveBeenCalledTimes(2));

    await user.type(await screen.findByLabelText('Tu pregunta sobre el mensaje'), '¿Es real?{Enter}');
    await waitFor(() => expect(followUp).toHaveBeenCalledTimes(2));
    const [first, second] = followUp.mock.calls.map(([req]) => req);
    expect(second.initial_message).toBe('Otro mensaje raro de ANSES');
    expect(second.history).toEqual([]);
    expect(second.session_key).not.toBe(first.session_key);
  });

  it('"Nueva consulta" vuelve al modo análisis', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);

    await user.click(screen.getByRole('button', { name: 'Nueva consulta' }));

    expect(screen.getByLabelText('Mensaje sospechoso')).toBeInTheDocument();
    expect(screen.queryByText('Preguntando sobre el mensaje analizado')).not.toBeInTheDocument();
  });
});

describe('ChatAssistant: resumen fijo del diagnóstico', () => {
  let notify: (visible: boolean) => void = () => {};
  const OriginalObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    analyzeMessage.mockReset();
    analyzeMessage.mockResolvedValue(ANALYSIS);
    // IntersectionObserver controlable: el test decide si la tarjeta está a la vista.
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        notify = (visible) => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as never);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = OriginalObserver;
  });

  it('aparece cuando la tarjeta sale de la vista y lleva de vuelta a ella', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    const user = userEvent.setup();
    render(<ChatAssistant />);
    await analyze(user);
    const pinnedName = /Riesgo alto · 85% · Banco Formosa/;

    expect(screen.queryByRole('button', { name: pinnedName })).not.toBeInTheDocument();

    act(() => notify(false));
    await user.click(screen.getByRole('button', { name: pinnedName }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });

    act(() => notify(true));
    expect(screen.queryByRole('button', { name: pinnedName })).not.toBeInTheDocument();
    scrollIntoView.mockRestore();
  });
});

describe('categorías nuevas del backend', () => {
  it.each([
    ['FAMILY_IMPERSONATION', 'Se hace pasar por un familiar'],
    ['COMMUNITY_OUTBREAK', 'Coincide con un brote reportado'],
    ['PROMPT_INJECTION', 'Intenta manipular al asistente'],
  ])('%s tiene nombre propio', (category, label) => {
    expect(getCategoryStyle(category).label).toBe(label);
  });
});
