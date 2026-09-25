import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AuthModal', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      is2FAPending: false,
      login: mockLogin,
      register: mockRegister,
      totpStatus: { enabled: false, qrCode: null, secret: null },
      setup2FA: vi.fn(),
      verify2FA: vi.fn(),
    } as any);
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza diálogo y permite cerrar con el botón X y tecla Escape', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Cerrar ventana de autenticación/i));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('permite conmutar entre Iniciar Sesión y Registrarse', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByRole('tab', { name: /Registrarse/i }));
    expect(screen.getByRole('heading', { name: 'Crear Cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Iniciar Sesión/i }));
    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  it('envía formulario de inicio de sesión exitosamente', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@ejemplo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(mockLogin).toHaveBeenCalledWith('juan@ejemplo.com', 'secret123', undefined);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('muestra input de 2FA cuando is2FAPending es true y envía el código TOTP', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ success: true });

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      is2FAPending: true,
      login: mockLogin,
      register: mockRegister,
      totpStatus: { enabled: false, qrCode: null, secret: null },
      setup2FA: vi.fn(),
      verify2FA: vi.fn(),
    } as any);

    render(<AuthModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/Código 2FA/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: 'Validar Código 2FA' });
    expect(submitBtn).toBeInTheDocument();

    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@ejemplo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secret123');
    await user.type(screen.getByLabelText(/Código 2FA/i), '654321');
    await user.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('juan@ejemplo.com', 'secret123', '654321');
  });

  it('envía formulario de registro exitosamente', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(true);

    render(<AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />);

    await user.type(screen.getByLabelText('Nombre completo'), 'Gabriel Pineda');
    await user.type(screen.getByLabelText('Correo electrónico'), 'gabriel@formosa.gob.ar');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(mockRegister).toHaveBeenCalledWith('Gabriel Pineda', 'gabriel@formosa.gob.ar', 'password123');
  });
});
