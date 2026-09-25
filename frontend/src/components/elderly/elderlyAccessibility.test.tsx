import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatAnalysisResponse } from '../../types';
import { ElderlyHomeView } from './ElderlyHomeView';
import { ElderlyModeProvider } from './ElderlyModeContext';
import { ElderlyModeToggle } from './ElderlyModeToggle';
import { ElderlyPanicScreen } from './ElderlyPanicScreen';
import { ElderlyVerdictCard } from './ElderlyVerdictCard';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

/**
 * Auditoría automática con axe-core. Se desactivan dos reglas que jsdom no puede evaluar bien:
 * - color-contrast: jsdom no calcula estilos; el contraste se verifica en elderlyContrast.test.ts.
 * - region: se renderizan componentes sueltos, fuera del <main> de la app.
 */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const violations = results.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(violations).toEqual([]);
}

const analysis = (risk_level: ChatAnalysisResponse['risk_level']): ChatAnalysisResponse => ({
  risk_level,
  risk_percentage: 80,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA',
  immediate_action: 'No respondas.',
  what_not_to_do: 'No des el token.',
  highlighted_phrases: [],
  wa_share_text: 'Hola',
});

describe('Modo Abuelo: auditoría axe-core', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('interruptor del header', async () => {
    const { container } = render(<ElderlyModeToggle />, { wrapper: ElderlyModeProvider });
    await expectNoAxeViolations(container);
  });

  it('inicio de 3 botones', async () => {
    const { container } = render(<ElderlyHomeView onAction={vi.fn()} />);
    await expectNoAxeViolations(container);
  });

  it('pantalla antipánico', async () => {
    const { container } = render(<ElderlyPanicScreen onBack={vi.fn()} />);
    await expectNoAxeViolations(container);
  });

  it.each(['HIGH', 'MEDIUM', 'LOW'] as const)('veredicto %s', async (level) => {
    const { container } = render(<ElderlyVerdictCard analysis={analysis(level)} onShareWhatsApp={vi.fn()} />);
    await expectNoAxeViolations(container);
  });
});

describe('Modo Abuelo: uso con teclado', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('el interruptor se activa con Espacio y con Enter', async () => {
    const user = userEvent.setup();
    render(<ElderlyModeToggle />, { wrapper: ElderlyModeProvider });
    const toggle = screen.getByRole('switch', { name: 'Modo Abuelo / Simple' });

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('el inicio se recorre con Tab en el orden en que se ve', async () => {
    const user = userEvent.setup();
    render(<ElderlyHomeView onAction={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole('button', { name: /Pegar mensaje/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: /Avisar a mi hijo/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Me están llamando/ })).toHaveFocus();
  });

  it('la pantalla antipánico se abre, se recorre y se cierra con teclado, sin perder el foco', async () => {
    const user = userEvent.setup();
    render(<ElderlyHomeView onAction={vi.fn()} />);

    await user.tab();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');

    // El foco arranca en el título, para que el lector de pantalla lo anuncie primero.
    expect(screen.getByRole('heading', { name: /Cortá la llamada ya/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: /Llamar al Banco Formosa/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: /Llamar a la Policía/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus();

    await user.keyboard('{Enter}');
    // Al volver, el foco regresa al botón que abrió la pantalla (no se pierde en <body>).
    expect(screen.getByRole('button', { name: /Me están llamando/ })).toHaveFocus();
  });

  it('los botones del veredicto se alcanzan con Tab', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<ElderlyVerdictCard analysis={analysis('HIGH')} onShareWhatsApp={onShare} />);

    await user.tab();
    expect(screen.getByRole('button', { name: /Avisar a un familiar/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onShare).toHaveBeenCalledOnce();
    await user.tab();
    expect(screen.getByRole('link', { name: /Llamar al Banco Formosa/ })).toHaveFocus();
  });
});
