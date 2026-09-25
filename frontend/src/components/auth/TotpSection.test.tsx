import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TotpSection } from './TotpSection';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('TotpSection', () => {
  const mockSetup2FA = vi.fn();
  const mockVerify2FA = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado 2FA Inactivo y botón para configurar cuando no está habilitado', () => {
    vi.mocked(useAuth).mockReturnValue({
      totpStatus: { enabled: false, qrCode: null, secret: null },
      setup2FA: mockSetup2FA,
      verify2FA: mockVerify2FA,
    } as any);

    render(<TotpSection />);

    expect(screen.getByText('2FA Inactivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Configurar Segundo Factor/i })).toBeInTheDocument();
  });

  it('muestra estado 2FA Activo y botón de reconfiguración cuando está habilitado', () => {
    vi.mocked(useAuth).mockReturnValue({
      totpStatus: { enabled: true, qrCode: null, secret: null },
      setup2FA: mockSetup2FA,
      verify2FA: mockVerify2FA,
    } as any);

    render(<TotpSection />);

    expect(screen.getByText('2FA Activo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reconfigurar Segundo Factor/i })).toBeInTheDocument();
  });

  it('inicia configuración llamando a setup2FA al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      totpStatus: { enabled: false, qrCode: null, secret: null },
      setup2FA: mockSetup2FA,
      verify2FA: mockVerify2FA,
    } as any);

    render(<TotpSection />);

    await user.click(screen.getByRole('button', { name: /Configurar Segundo Factor/i }));
    expect(mockSetup2FA).toHaveBeenCalledTimes(1);
  });

  it('renderiza QR, código secreto y permite verificar el código de 6 dígitos', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockVerify2FA.mockResolvedValueOnce(true);

    vi.mocked(useAuth).mockReturnValue({
      totpStatus: {
        enabled: false,
        qrCode: 'data:image/png;base64,mockQrCodeData',
        secret: 'JBSWY3DPEHPK3PXP',
      },
      setup2FA: mockSetup2FA,
      verify2FA: mockVerify2FA,
    } as any);

    render(<TotpSection onSuccess={onSuccess} />);

    expect(screen.getByAltText(/Código QR/i)).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();

    const input = screen.getByLabelText(/Código de verificación 2FA/i);
    await user.type(input, '123456');
    await user.click(screen.getByRole('button', { name: /Verificar/i }));

    expect(mockVerify2FA).toHaveBeenCalledWith('123456');
  });
});
