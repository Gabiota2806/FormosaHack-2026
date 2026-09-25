import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cada test carga el módulo de cero: la clave queda cacheada en memoria a nivel módulo.
const load = async () => {
  vi.resetModules();
  return import('./historyPreference');
};

describe('historial anónimo: clave y preferencia', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('crea una clave anónima estable y la guarda en el navegador', async () => {
    const { getAnonymousSessionKey, SESSION_KEY_STORAGE } = await load();

    const key = getAnonymousSessionKey();
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(getAnonymousSessionKey()).toBe(key);
    expect(localStorage.getItem(SESSION_KEY_STORAGE)).toBe(key);
  });

  it('solo hay algo para vincular si se guardó una consulta con la clave', async () => {
    const { getAnonymousSessionKey, markSessionUsed, sessionKeyToClaim } = await load();
    const key = getAnonymousSessionKey();

    expect(sessionKeyToClaim()).toBeNull();
    markSessionUsed();
    expect(sessionKeyToClaim()).toBe(key);
  });

  it('después de vincular, la clave se renueva', async () => {
    const { getAnonymousSessionKey, markSessionUsed, rotateSessionKey, sessionKeyToClaim } = await load();
    const first = getAnonymousSessionKey();
    markSessionUsed();

    rotateSessionKey();

    expect(sessionKeyToClaim()).toBeNull();
    expect(getAnonymousSessionKey()).not.toBe(first);
  });

  it('recuerda "No guardar mis consultas"', async () => {
    const { useHistoryOptOut, isHistoryOptedOut } = await load();
    const { result } = renderHook(() => useHistoryOptOut());
    expect(result.current[0]).toBe(false);

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(isHistoryOptedOut()).toBe(true);
  });
});
