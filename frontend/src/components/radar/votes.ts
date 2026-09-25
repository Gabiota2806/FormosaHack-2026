// Voto anónimo: una huella aleatoria por navegador y la lista de amenazas ya votadas.
// localStorage puede fallar (modo privado, datos bloqueados): en ese caso se usa memoria.

const FINGERPRINT_KEY = 'user_fingerprint';
const VOTED_KEY = 'radar_voted_ids';

let memoryFingerprint: string | null = null;

// crypto.getRandomValues y no crypto.randomUUID: randomUUID solo existe en contextos seguros
// (HTTPS o localhost) y falla al abrir la app por http:// con una IP de la red local.
const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

export function getFingerprint(): string {
  try {
    const stored = localStorage.getItem(FINGERPRINT_KEY);
    if (stored) return stored;
  } catch {
    // Sin acceso a localStorage.
  }

  memoryFingerprint ??= `fp_${randomHex(16)}`;
  try {
    localStorage.setItem(FINGERPRINT_KEY, memoryFingerprint);
  } catch {
    // Queda solo en memoria durante esta sesión.
  }
  return memoryFingerprint;
}

export function loadVotedIds(): Set<number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VOTED_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveVotedIds(ids: Set<number>) {
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...ids]));
  } catch {
    // Sin persistencia: el backend igual rechaza el voto repetido por huella.
  }
}
