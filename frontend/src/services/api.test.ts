import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { api } from './api';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

/** Adaptador que simula que el servidor no responde (error de red, sin response). */
const networkDown = (config: InternalAxiosRequestConfig) =>
  Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));

describe('interceptor de errores de api', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
  });

  it('avisa con un toast cuando falla la conexión', async () => {
    await expect(api.get('/x', { adapter: networkDown })).rejects.toThrow('Network Error');
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it('no avisa si el pedido es silent: lo maneja quien lo hizo', async () => {
    await expect(api.get('/x', { adapter: networkDown, silent: true })).rejects.toThrow('Network Error');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
