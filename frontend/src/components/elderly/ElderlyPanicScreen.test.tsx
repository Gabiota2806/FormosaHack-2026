import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ElderlyPanicScreen } from './ElderlyPanicScreen';

describe('ElderlyPanicScreen', () => {
  it('muestra la orden de cortar y la regla del banco', () => {
    render(<ElderlyPanicScreen onBack={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Cortá la llamada ya/i })).toBeInTheDocument();
    expect(screen.getByText('Ningún banco te va a pedir tu clave por teléfono.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marca en 1 toque al Banco Formosa y a la Policía', () => {
    render(<ElderlyPanicScreen onBack={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Llamar al Banco Formosa al 0800-777-2262' })).toHaveAttribute(
      'href',
      'tel:08007772262',
    );
    expect(screen.getByRole('link', { name: 'Llamar a la Policía al 911' })).toHaveAttribute('href', 'tel:911');
  });

  it('los botones miden al menos 64px de alto (min-h-16)', () => {
    render(<ElderlyPanicScreen onBack={vi.fn()} />);

    for (const el of [...screen.getAllByRole('link'), screen.getByRole('button', { name: 'Volver' })]) {
      expect(el).toHaveClass('min-h-16');
    }
  });

  it('pone el foco en el título al abrirse', () => {
    render(<ElderlyPanicScreen onBack={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Cortá la llamada ya/i })).toHaveFocus();
  });

  it('"Volver" avisa a quien la abrió', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ElderlyPanicScreen onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
