import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Cada test carga el módulo de cero: la huella queda cacheada en memoria a nivel módulo.
const loadVotes = async () => {
  vi.resetModules();
  return import('./votes');
};

const FINGERPRINT = /^fp_[0-9a-f]{32}$/;

describe('votes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('genera la huella sin crypto.randomUUID (http:// con IP, contexto no seguro)', async () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const { getFingerprint } = await loadVotes();
      const fingerprint = getFingerprint();

      expect(fingerprint).toMatch(FINGERPRINT);
      expect(localStorage.getItem('user_fingerprint')).toBe(fingerprint);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });

  it('reutiliza la huella guardada', async () => {
    localStorage.setItem('user_fingerprint', 'fp_guardada_123');
    const { getFingerprint } = await loadVotes();

    expect(getFingerprint()).toBe('fp_guardada_123');
  });

  it('mantiene la misma huella en memoria si localStorage no está disponible', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { getFingerprint } = await loadVotes();

    const first = getFingerprint();
    expect(first).toMatch(FINGERPRINT);
    expect(getFingerprint()).toBe(first);
  });

  it('ignora valores corruptos en los votos guardados', async () => {
    localStorage.setItem('radar_voted_ids', JSON.stringify([1, 'x', 2.5, 3]));
    const { loadVotedIds } = await loadVotes();

    expect([...loadVotedIds()]).toEqual([1, 3]);
  });
});
