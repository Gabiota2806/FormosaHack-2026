import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { AuthProvider, useAuth, TOKEN_STORAGE_KEY } from './AuthContext';
import { authApi, historyApi } from '../services/api';
import type { User, TokenResponse, TOTPSetupResponse, TOTPVerifyResponse, ChatSessionOut } from '../types';

vi.mock('../services/api', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getMe: vi.fn(),
    setup2FA: vi.fn(),
    verify2FA: vi.fn(),
  },
  historyApi: {
    claim: vi.fn(),
    list: vi.fn(),
    getEntry: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockUser: User = {
  id: 1,
  name: 'Gabriel Pineda',
  email: 'gabriel@formosa.gob.ar',
  role: 'admin',
  is_totp_enabled: false,
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('lanza error si useAuth se usa fuera de AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe ser utilizado dentro de un AuthProvider'
    );
  });

  it('inicia en estado no autenticado si no hay token en localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('carga el perfil del usuario si hay un token válido en localStorage', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token-123');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('valid-token-123');
    expect(authApi.getMe).toHaveBeenCalledWith(undefined, true);
  });

  it('limpia el token si la verificación inicial falla por expiración', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('permite registrar un usuario llamando a authApi.register', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let ok = false;
    await act(async () => {
      ok = await result.current.register('Gabriel Pineda', 'gabriel@formosa.gob.ar', 'secret123');
    });

    expect(ok).toBe(true);
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Gabriel Pineda',
      email: 'gabriel@formosa.gob.ar',
      password: 'secret123',
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Usuario registrado con éxito. Ahora podés iniciar sesión.'
    );
  });

  it('inicia sesión exitosamente cuando las credenciales no requieren 2FA', async () => {
    const loginResponse: TokenResponse = {
      access_token: 'new-jwt-token',
      token_type: 'bearer',
      requires_2fa: false,
    };
    vi.mocked(authApi.login).mockResolvedValueOnce(loginResponse);
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let loginResult = { success: false };
    await act(async () => {
      loginResult = await result.current.login('gabriel@formosa.gob.ar', 'secret123');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('new-jwt-token');
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-jwt-token');
    expect(toast.success).toHaveBeenCalledWith('Sesión iniciada correctamente');
  });

  it('maneja el desafío de 2FA si el usuario tiene TOTP configurado', async () => {
    const login2FAResponse: TokenResponse = {
      requires_2fa: true,
      temp_token: 'temp-token-2fa',
    };
    vi.mocked(authApi.login).mockResolvedValueOnce(login2FAResponse);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let loginResult: { success: boolean; requires2FA?: boolean } = { success: false, requires2FA: false };
    await act(async () => {
      loginResult = await result.current.login('gabriel@formosa.gob.ar', 'secret123');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.requires2FA).toBe(true);
    expect(result.current.is2FAPending).toBe(true);
    expect(result.current.tempToken).toBe('temp-token-2fa');
    expect(result.current.isAuthenticated).toBe(false);
    expect(toast.info).toHaveBeenCalledWith(
      'Se requiere código de verificación de Segundo Factor (2FA).'
    );
  });

  it('permite cerrar sesión y limpia el almacenamiento local', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'some-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(toast.info).toHaveBeenCalledWith('Sesión cerrada correctamente.');
  });

  it('reacciona al evento auth:expired limpiando el estado reactivo', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'active-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('enrola 2FA obteniendo el QR y el secreto', async () => {
    const setupResponse: TOTPSetupResponse = {
      secret: 'JBSWY3DPEHPK3PXP',
      qr_code_base64: 'data:image/png;base64,mockqr',
      provisioning_uri: 'otpauth://totp/FormosaHack?secret=JBSWY3DPEHPK3PXP',
    };
    vi.mocked(authApi.setup2FA).mockResolvedValueOnce(setupResponse);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let res: TOTPSetupResponse | null = null;
    await act(async () => {
      res = await result.current.setup2FA();
    });

    expect(res).toEqual(setupResponse);
    expect(result.current.totpStatus.qrCode).toBe(setupResponse.qr_code_base64);
    expect(result.current.totpStatus.secret).toBe(setupResponse.secret);
  });

  it('verifica el código 2FA y actualiza el estado', async () => {
    const verifyResponse: TOTPVerifyResponse = {
      message: '2FA activado',
      is_totp_enabled: true,
    };
    vi.mocked(authApi.verify2FA).mockResolvedValueOnce(verifyResponse);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let success = false;
    await act(async () => {
      success = await result.current.verify2FA('123456');
    });

    expect(success).toBe(true);
    expect(result.current.totpStatus.enabled).toBe(true);
    expect(result.current.totpStatus.qrCode).toBeNull();
  });

  it('vincula la sesión anónima llamando a historyApi.claim', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);
    const claimRes: ChatSessionOut = {
      id: 5,
      session_key: 'session-uuid-1234',
      user_id: 1,
      active: true,
      created_at: new Date().toISOString(),
    };
    vi.mocked(historyApi.claim).mockResolvedValueOnce(claimRes);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let claimed = false;
    await act(async () => {
      claimed = await result.current.claimAnonymousSession('session-uuid-1234');
    });

    expect(claimed).toBe(true);
    expect(historyApi.claim).toHaveBeenCalledWith('session-uuid-1234');
  });
});
