import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDropdown } from './UserDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useChatWidget } from '../widget/chatWidgetContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../widget/chatWidgetContext', () => ({
  useChatWidget: vi.fn(),
}));

describe('UserDropdown', () => {
  const mockOpenAuth = vi.fn();
  const mockOpenSecurity = vi.fn();
  const mockLogout = vi.fn();
  const mockOpenChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatWidget).mockReturnValue({
      isOpen: false,
      openChat: mockOpenChat,
      closeChat: vi.fn(),
      hasActiveSession: false,
      setHasActiveSession: vi.fn(),
      request: null,
      onRequestHandled: vi.fn(),
    });
  });

  it('muestra botón "Ingresar" cuando el usuario no está autenticado y abre el modal', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      totpStatus: { enabled: false, qrCode: null, secret: null },
      logout: mockLogout,
    } as any);

    render(<UserDropdown onOpenAuth={mockOpenAuth} onOpenSecurity={mockOpenSecurity} />);

    const ingresarBtn = screen.getByRole('button', { name: /Ingresar al sistema/i });
    expect(ingresarBtn).toBeInTheDocument();

    await user.click(ingresarBtn);
    expect(mockOpenAuth).toHaveBeenCalledTimes(1);
  });

  it('muestra píldora de usuario, abre menú con datos, rol y estado 2FA', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: 'Gabriel Pineda',
        email: 'gabriel@formosa.gob.ar',
        role: 'admin',
        is_totp_enabled: true,
      },
      isAuthenticated: true,
      totpStatus: { enabled: true, qrCode: null, secret: null },
      logout: mockLogout,
    } as any);

    render(<UserDropdown onOpenAuth={mockOpenAuth} onOpenSecurity={mockOpenSecurity} />);

    const userPill = screen.getByRole('button', { name: /Menú de usuario/i });
    expect(userPill).toBeInTheDocument();
    expect(screen.getByText('Gabriel Pineda')).toBeInTheDocument();

    await user.click(userPill);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('gabriel@formosa.gob.ar')).toBeInTheDocument();
    expect(screen.getByText('2FA Activo')).toBeInTheDocument();
  });

  it('permite acceder a Mis Consultas Guardadas abriendo el widget en la vista de historial', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: 'Gabriel Pineda',
        email: 'gabriel@formosa.gob.ar',
        role: 'user',
        is_totp_enabled: false,
      },
      isAuthenticated: true,
      totpStatus: { enabled: false, qrCode: null, secret: null },
      logout: mockLogout,
    } as any);

    render(<UserDropdown onOpenAuth={mockOpenAuth} onOpenSecurity={mockOpenSecurity} />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('menuitem', { name: /Mis Consultas Guardadas/i }));

    expect(mockOpenChat).toHaveBeenCalledWith({ view: 'history' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('permite abrir configuración de Seguridad y 2FA', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: 'Gabriel Pineda',
        email: 'gabriel@formosa.gob.ar',
        role: 'admin',
        is_totp_enabled: false,
      },
      isAuthenticated: true,
      totpStatus: { enabled: false, qrCode: null, secret: null },
      logout: mockLogout,
    } as any);

    render(<UserDropdown onOpenAuth={mockOpenAuth} onOpenSecurity={mockOpenSecurity} />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('menuitem', { name: /Seguridad y 2FA TOTP/i }));

    expect(mockOpenSecurity).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('permite cerrar sesión y cierra el menú desplegable', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: 'Gabriel Pineda',
        email: 'gabriel@formosa.gob.ar',
        role: 'admin',
        is_totp_enabled: true,
      },
      isAuthenticated: true,
      totpStatus: { enabled: true, qrCode: null, secret: null },
      logout: mockLogout,
    } as any);

    render(<UserDropdown onOpenAuth={mockOpenAuth} onOpenSecurity={mockOpenSecurity} />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar Sesión/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
