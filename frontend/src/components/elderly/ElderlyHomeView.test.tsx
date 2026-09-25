import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ElderlyHomeView, FAMILY_HELP_TEXT } from './ElderlyHomeView';

describe('ElderlyHomeView', () => {
  it('muestra los 3 botones de auxilio con nombres claros', () => {
    render(<ElderlyHomeView onAction={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Pegar mensaje para revisar si es mentira/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avisar a mi hijo \/ familiar por WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Me están llamando y tengo miedo/ })).toBeInTheDocument();
  });

  it('revisar un mensaje abre el análisis y la llamada abre la ayuda inmediata', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ElderlyHomeView onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: /Pegar mensaje/ }));
    expect(onAction).toHaveBeenLastCalledWith('ANALYZE');

    await user.click(screen.getByRole('button', { name: /Me están llamando/ }));
    expect(onAction).toHaveBeenLastCalledWith('DURING_CALL');
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('avisar a un familiar abre WhatsApp con el pedido de ayuda, en otra pestaña', () => {
    render(<ElderlyHomeView onAction={vi.fn()} />);
    const link = screen.getByRole('link', { name: /Avisar a mi hijo/ });

    expect(link).toHaveAttribute('href', `https://wa.me/?text=${encodeURIComponent(FAMILY_HELP_TEXT)}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('cada botón mide al menos 64px de alto (min-h-16)', () => {
    render(<ElderlyHomeView onAction={vi.fn()} />);

    for (const el of [...screen.getAllByRole('button'), screen.getByRole('link')]) {
      expect(el).toHaveClass('min-h-16');
    }
  });
});
