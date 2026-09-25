import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ElderlyModeToggle } from './ElderlyModeToggle';
import { ElderlyModeProvider } from './ElderlyModeContext';
import { ELDERLY_CLASS, ELDERLY_STORAGE_KEY, LEGACY_PROTECTOR_KEY, useElderlyMode } from './elderlyMode';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const TOGGLE_NAME = 'Modo Abuelo / Simple';

function renderToggle() {
  return render(<ElderlyModeToggle />, { wrapper: ElderlyModeProvider });
}

describe('Modo Abuelo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove(ELDERLY_CLASS);
  });

  it('es un interruptor accesible, apagado por defecto', () => {
    renderToggle();

    const toggle = screen.getByRole('switch', { name: TOGGLE_NAME });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);
  });

  it('activa y desactiva la clase .modo-abuelo y lo recuerda', async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole('switch', { name: TOGGLE_NAME });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveClass(ELDERLY_CLASS);
    expect(localStorage.getItem(ELDERLY_STORAGE_KEY)).toBe('true');
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/activado/));

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);
    expect(localStorage.getItem(ELDERLY_STORAGE_KEY)).toBe('false');
    expect(toast.success).toHaveBeenLastCalledWith(expect.stringMatching(/desactivado/));
  });

  it('arranca activado si se había elegido en otra visita', () => {
    localStorage.setItem(ELDERLY_STORAGE_KEY, 'true');
    renderToggle();

    expect(screen.getByRole('switch', { name: TOGGLE_NAME })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveClass(ELDERLY_CLASS);
  });

  it('hereda la preferencia del Modo Protector Mayor y migra la clave', () => {
    localStorage.setItem(LEGACY_PROTECTOR_KEY, 'on');
    renderToggle();

    expect(screen.getByRole('switch', { name: TOGGLE_NAME })).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem(ELDERLY_STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(LEGACY_PROTECTOR_KEY)).toBeNull();
  });

  it('la preferencia nueva manda sobre la del Modo Protector Mayor', () => {
    localStorage.setItem(ELDERLY_STORAGE_KEY, 'false');
    localStorage.setItem(LEGACY_PROTECTOR_KEY, 'on');
    renderToggle();

    expect(screen.getByRole('switch', { name: TOGGLE_NAME })).toHaveAttribute('aria-checked', 'false');
  });

  it('funciona aunque localStorage no esté disponible', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('switch', { name: TOGGLE_NAME }));
    expect(document.documentElement).toHaveClass(ELDERLY_CLASS);
  });

  it('comparte el estado con cualquier componente dentro del Provider', async () => {
    const user = userEvent.setup();
    function Estado() {
      const { enabled } = useElderlyMode();
      return <p>{enabled ? 'vista simple' : 'vista completa'}</p>;
    }
    render(
      <ElderlyModeProvider>
        <ElderlyModeToggle />
        <Estado />
      </ElderlyModeProvider>,
    );

    expect(screen.getByText('vista completa')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: TOGGLE_NAME }));
    expect(screen.getByText('vista simple')).toBeInTheDocument();
  });

  it('falla con un mensaje claro si se usa fuera del Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useElderlyMode())).toThrow(/ElderlyModeProvider/);
  });
});
