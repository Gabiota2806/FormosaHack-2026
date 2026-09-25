import { render as rtlRender, screen, waitFor, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse } from '../../types';
import { CONTENTION, WELCOME_TEXT } from '../chat/scripts';
import { ChatWidget } from './ChatWidget';
import { CHAT_PANEL_ID } from './ChatWidgetPanel';
import { ChatWidgetProvider } from './ChatWidgetProvider';
import { ElderlyModeProvider } from '../elderly/ElderlyModeContext';
import { useChatWidget, type OpenChatOptions } from './chatWidgetContext';

vi.mock('../../services/api', () => ({
  chatApi: { analyzeMessage: vi.fn() },
}));

/** Simula el ancho de pantalla: true = PC (>= 640 px), false = celular. */
const setDesktop = (desktop: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: desktop }) as unknown as typeof window.matchMedia;
};

// El chat lee el Modo Abuelo del contexto.
function Providers({ children }: { children: ReactNode }) {
  return (
    <ElderlyModeProvider>
      <ChatWidgetProvider>{children}</ChatWidgetProvider>
    </ElderlyModeProvider>
  );
}

const render = (ui: ReactElement, options?: RenderOptions) => rtlRender(ui, { wrapper: Providers, ...options });

const panel = () => screen.getByRole('dialog', { name: 'Asistente CiberGuardián', hidden: true });
const launcher = () => screen.getByRole('button', { name: /(Abrir|Cerrar) asistente CiberGuardián/ });

describe('ChatWidget', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    setDesktop(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('arranca cerrado: el panel está montado pero inactivo', () => {
    render(<ChatWidget />);

    expect(panel()).toHaveAttribute('id', CHAT_PANEL_ID);
    expect(panel()).toHaveAttribute('inert');
    expect(launcher()).toHaveAttribute('aria-expanded', 'false');
  });

  it('el botón abre el panel con el chat y en la PC pone el cursor en la caja', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);

    await user.click(launcher());

    expect(panel()).not.toHaveAttribute('inert');
    expect(launcher()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(WELCOME_TEXT)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Mensaje sospechoso')).toHaveFocus());
  });

  it('en el celular abre sin enfocar la caja (no despliega el teclado)', async () => {
    setDesktop(false);
    const user = userEvent.setup();
    render(<ChatWidget />);

    await user.click(launcher());
    await new Promise((r) => requestAnimationFrame(r));

    expect(panel()).not.toHaveAttribute('inert');
    expect(screen.getByLabelText('Mensaje sospechoso')).not.toHaveFocus();
  });

  it('"Minimizar" cierra el panel y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(launcher());

    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));

    expect(panel()).toHaveAttribute('inert');
    await waitFor(() => expect(launcher()).toHaveFocus());
  });

  it('Escape minimiza el panel', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(launcher());

    await user.keyboard('{Escape}');
    expect(panel()).toHaveAttribute('inert');
  });

  it('Escape no lo minimiza si hay un diálogo modal encima (p. ej. el SOS)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ChatWidget />
        <div role="dialog" aria-modal="true" aria-label="SOS" />
      </>,
    );
    await user.click(launcher());

    await user.keyboard('{Escape}');
    expect(panel()).not.toHaveAttribute('inert');
  });

  it('tocar el fondo (celular) cierra la hoja', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(launcher());

    await user.click(screen.getByTestId('chat-widget-backdrop'));
    expect(panel()).toHaveAttribute('inert');
  });

  it('la conversación se conserva al minimizar y volver a abrir', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(launcher());
    await user.click(screen.getByRole('button', { name: 'Me están llamando o apurando ahora mismo' }));
    await screen.findByText(CONTENTION.title);

    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));
    await user.click(launcher());

    expect(screen.getByText(CONTENTION.title)).toBeInTheDocument();
  });
});

/** Botón de otra parte de la app que abre el chat con un pedido (como los CTAs de la landing). */
function Opener({ options, label }: { options?: OpenChatOptions; label: string }) {
  const { openChat } = useChatWidget();
  return (
    <button type="button" onClick={() => openChat(options)}>
      {label}
    </button>
  );
}

const HIGH_RISK: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 90,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: intento de estafa.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [],
  wa_share_text: '',
};

describe('ChatWidget: estado global y apertura programática (FH26-70)', () => {
  const analyzeMessage = vi.mocked(chatApi.analyzeMessage);

  beforeEach(() => {
    localStorage.clear();
    setDesktop(true);
    analyzeMessage.mockReset();
    analyzeMessage.mockResolvedValue(HIGH_RISK);
  });

  it('abre el panel desde otra parte de la app en el momento pedido', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener label="Durante" options={{ entry: 'DURANTE' }} />
        <ChatWidget />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Durante' }));

    expect(panel()).not.toHaveAttribute('inert');
    expect(await screen.findByText(CONTENTION.title)).toBeInTheDocument();
  });

  it('abre y analiza un mensaje una sola vez, aunque se minimice y se vuelva a abrir', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener label="Compartido" options={{ message: 'Banco Formosa: pasame el token' }} />
        <ChatWidget />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Compartido' }));
    expect(await screen.findByText('ALERTA ROJA: intento de estafa.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));
    await user.click(launcher());

    expect(analyzeMessage).toHaveBeenCalledExactlyOnceWith('Banco Formosa: pasame el token');
  });

  it('el mismo pedido hecho dos veces se ejecuta dos veces', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener label="Durante" options={{ entry: 'DURANTE' }} />
        <ChatWidget />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Durante' }));
    await screen.findByText(CONTENTION.title);
    await user.click(screen.getByRole('button', { name: 'Durante' }));

    await waitFor(() => expect(screen.getAllByText(CONTENTION.title)).toHaveLength(2));
  });

  it('un mensaje pedido no borra el borrador que la persona estaba escribiendo', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener label="Compartido" options={{ message: 'Banco Formosa: pasame el token' }} />
        <ChatWidget />
      </>,
    );
    await user.click(launcher());
    await user.type(screen.getByLabelText('Mensaje sospechoso'), 'mi borrador');

    await user.click(screen.getByRole('button', { name: 'Compartido' }));
    await screen.findByText('ALERTA ROJA: intento de estafa.');

    // El análisis pasa la caja al modo seguimiento, pero el borrador sigue ahí.
    expect(screen.getByLabelText('Tu pregunta sobre el mensaje')).toHaveValue('mi borrador');
  });

  it('abrir sin pedido solo abre el panel', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener label="Abrir" />
        <ChatWidget />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(panel()).not.toHaveAttribute('inert');
    expect(screen.getByText(WELCOME_TEXT)).toBeInTheDocument();
    expect(analyzeMessage).not.toHaveBeenCalled();
  });

  it('el botón indica consulta en curso con conversación y con borrador', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    expect(screen.queryByTestId('launcher-session-badge')).not.toBeInTheDocument();

    await user.click(launcher());
    await user.type(screen.getByLabelText('Mensaje sospechoso'), 'borrador');
    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));
    expect(screen.getByTestId('launcher-session-badge')).toBeInTheDocument();

    await user.click(launcher());
    await user.clear(screen.getByLabelText('Mensaje sospechoso'));
    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));
    expect(screen.queryByTestId('launcher-session-badge')).not.toBeInTheDocument();

    await user.click(launcher());
    await user.click(screen.getByRole('button', { name: 'Me están llamando o apurando ahora mismo' }));
    await screen.findByText(CONTENTION.title);
    await user.click(screen.getByRole('button', { name: 'Minimizar asistente' }));
    expect(screen.getByTestId('launcher-session-badge')).toBeInTheDocument();
  });

  it('useChatWidget fuera del proveedor avisa con un error claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => rtlRender(<Opener label="x" />)).toThrow('useChatWidget debe usarse dentro de <ChatWidgetProvider>.');
    spy.mockRestore();
  });
});
