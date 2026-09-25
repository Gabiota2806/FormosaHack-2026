import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ProtectorModeToggle } from './ProtectorModeToggle';
import { PROTECTOR_STORAGE_KEY } from './useProtectorMode';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('ProtectorModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.protector;
  });

  it('es un interruptor accesible, apagado por defecto', () => {
    render(<ProtectorModeToggle />);

    const toggle = screen.getByRole('switch', { name: 'Modo Protector Mayor' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.dataset.protector).toBeUndefined();
  });

  it('activa y desactiva el modo en la página y lo recuerda', async () => {
    const user = userEvent.setup();
    render(<ProtectorModeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Modo Protector Mayor' });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.protector).toBe('on');
    expect(localStorage.getItem(PROTECTOR_STORAGE_KEY)).toBe('on');
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/activado/));

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.dataset.protector).toBeUndefined();
    expect(localStorage.getItem(PROTECTOR_STORAGE_KEY)).toBe('off');
  });

  it('arranca activado si se había elegido antes', () => {
    localStorage.setItem(PROTECTOR_STORAGE_KEY, 'on');
    render(<ProtectorModeToggle />);

    expect(screen.getByRole('switch', { name: 'Modo Protector Mayor' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.protector).toBe('on');
  });

  it('funciona aunque localStorage no esté disponible', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const user = userEvent.setup();
    render(<ProtectorModeToggle />);

    await user.click(screen.getByRole('switch', { name: 'Modo Protector Mayor' }));
    expect(document.documentElement.dataset.protector).toBe('on');
  });
});
