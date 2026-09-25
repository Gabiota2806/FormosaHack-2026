import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatLauncher } from './ChatLauncher';
import { TOOLTIP_TEXT } from './ProactiveTooltip';
import { TOOLTIP_DISMISSED_KEY } from './useProactiveTooltip';

const DELAY = 20;

/** Monta el botón con su propio estado abierto/cerrado, como lo hará App. */
function Harness({ hasActiveSession = false, onToggle = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <ChatLauncher
      isOpen={open}
      onToggle={() => {
        onToggle();
        setOpen((o) => !o);
      }}
      hasActiveSession={hasActiveSession}
      tooltipDelayMs={DELAY}
    />
  );
}

describe('ChatLauncher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('abre y cierra, reflejando el estado para lectores de pantalla', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Abrir asistente CiberGuardián' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'chat-widget-panel');

    await user.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAccessibleName('Cerrar asistente CiberGuardián');
  });

  it('muestra el indicador de consulta en curso solo con el chat cerrado', async () => {
    const user = userEvent.setup();
    render(<Harness hasActiveSession />);

    expect(screen.getByTestId('launcher-session-badge')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Abrir asistente CiberGuardián (tenés una consulta en curso)' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Abrir asistente/ }));
    expect(screen.queryByTestId('launcher-session-badge')).not.toBeInTheDocument();
  });
});

describe('Globo de invitación', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('aparece después de la demora, no antes', async () => {
    render(<Harness />);

    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
    expect(await screen.findByText(TOOLTIP_TEXT)).toBeInTheDocument();
  });

  it('se cierra con la X y no vuelve a aparecer', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);

    await user.click(await screen.findByRole('button', { name: 'Cerrar invitación' }));
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
    expect(localStorage.getItem(TOOLTIP_DISMISSED_KEY)).toBe('1');

    unmount();
    render(<Harness />);
    await new Promise((r) => setTimeout(r, DELAY * 3));
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
  });

  it('se cierra con Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByText(TOOLTIP_TEXT);

    await user.keyboard('{Escape}');
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
  });

  it('tocar el texto abre el chat y no vuelve a invitar', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);

    await user.click(await screen.findByRole('button', { name: TOOLTIP_TEXT }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
    expect(localStorage.getItem(TOOLTIP_DISMISSED_KEY)).toBe('1');
  });

  it('abrir el chat desde el botón también cuenta como visto', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByText(TOOLTIP_TEXT);

    await user.click(screen.getByRole('button', { name: 'Abrir asistente CiberGuardián' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar asistente CiberGuardián' }));
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();
  });
});
