import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { api, authApi, historyApi } from './api';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

/** Adaptador que simula que el servidor no responde (error de red, sin response). */
const networkDown = (config: InternalAxiosRequestConfig) =>
  Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));

describe('interceptor de errores de api', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    localStorage.clear();
  });

  it('avisa con un toast cuando falla la conexión', async () => {
    await expect(api.get('/x', { adapter: networkDown })).rejects.toThrow('Network Error');
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it('no avisa si el pedido es silent: lo maneja quien lo hizo', async () => {
    await expect(api.get('/x', { adapter: networkDown, silent: true })).rejects.toThrow('Network Error');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('limpia el token y emite auth:expired ante un error 401', async () => {
    localStorage.setItem('access_token', 'stale-token');
    const authExpiredSpy = vi.fn();
    window.addEventListener('auth:expired', authExpiredSpy);

    const unauthorizedError = (config: InternalAxiosRequestConfig) =>
      Promise.reject(
        new AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Token inválido' },
          headers: {},
          config,
        } as AxiosResponse)
      );

    await expect(api.get('/protected', { adapter: unauthorizedError })).rejects.toThrow();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(authExpiredSpy).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledWith('Sesión expirada o credenciales inválidas.');

    window.removeEventListener('auth:expired', authExpiredSpy);
  });
});

describe('authApi & historyApi clients', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('authApi llama a los endpoints correspondientes de autenticación y 2FA', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { id: 1, name: 'Admin' } });

    await authApi.register({ name: 'Admin', email: 'admin@formosa.gob.ar', password: 'pass' });
    expect(postSpy).toHaveBeenCalledWith('/api/auth/register', {
      name: 'Admin',
      email: 'admin@formosa.gob.ar',
      password: 'pass',
    });

    await authApi.login({ email: 'admin@formosa.gob.ar', password: 'pass' });
    expect(postSpy).toHaveBeenCalledWith('/api/auth/login', {
      email: 'admin@formosa.gob.ar',
      password: 'pass',
    });

    await authApi.getMe();
    expect(getSpy).toHaveBeenCalledWith('/api/auth/me', { signal: undefined, silent: false });

    await authApi.setup2FA();
    expect(postSpy).toHaveBeenCalledWith('/api/auth/2fa/setup');

    await authApi.verify2FA('123456');
    expect(postSpy).toHaveBeenCalledWith('/api/auth/2fa/verify', { code: '123456' });
  });

  it('historyApi interactúa con los endpoints de historial de chat y auto-claim', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { items: [], total: 0 } });
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({ data: { deleted: true } });
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { session_key: 'sess-1' } });

    await historyApi.list({ page: 2, limit: 10 });
    expect(getSpy).toHaveBeenCalledWith('/api/core/chat/history', {
      params: { page: 2, limit: 10 },
      signal: undefined,
    });

    await historyApi.getEntry(42);
    expect(getSpy).toHaveBeenCalledWith('/api/core/chat/history/42', { signal: undefined });

    await historyApi.deleteEntry(42);
    expect(deleteSpy).toHaveBeenCalledWith('/api/core/chat/history/42');

    await historyApi.claim('sess-1');
    expect(postSpy).toHaveBeenCalledWith('/api/core/chat/history/claim', { session_key: 'sess-1' });
  });
});

