import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTENTION, WELCOME_TEXT } from '../chat/scripts';
import { ChatWidget } from './ChatWidget';
import { CHAT_PANEL_ID } from './ChatWidgetPanel';

vi.mock('../../services/api', () => ({
  chatApi: { analyzeMessage: vi.fn() },
}));

/** Simula el ancho de pantalla: true = PC (>= 640 px), false = celular. */
const setDesktop = (desktop: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: desktop }) as unknown as typeof window.matchMedia;
};

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
