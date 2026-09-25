import { useCallback, useState } from 'react';

// Historial anónimo (FH26-89): una clave por navegador que el backend usa para guardar las
// consultas hechas sin cuenta, y que al iniciar sesión se vincula a la cuenta (auto-claim).
// La persona puede pedir que no se guarden: en ese caso la clave no se envía.

export const SESSION_KEY_STORAGE = 'chat_session_key';
/** Marca que con la clave actual se guardó al menos una consulta (si no, no hay nada que vincular). */
export const SESSION_USED_STORAGE = 'chat_session_used';
export const OPT_OUT_STORAGE = 'chat_history_opt_out';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Sin localStorage: la clave dura solo esta visita.
  }
};

// crypto.getRandomValues (y no randomUUID): también funciona por http:// con una IP.
const randomKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

let memoryKey: string | null = null;

/** Clave anónima de este navegador; la crea si no existe. */
export function getAnonymousSessionKey(): string {
  const stored = read(SESSION_KEY_STORAGE);
  if (stored) return stored;
  memoryKey ??= randomKey();
  write(SESSION_KEY_STORAGE, memoryKey);
  return memoryKey;
}

export const markSessionUsed = () => write(SESSION_USED_STORAGE, '1');

/** La clave a vincular al iniciar sesión, o null si no se guardó ninguna consulta con ella. */
export function sessionKeyToClaim(): string | null {
  return read(SESSION_USED_STORAGE) === '1' ? read(SESSION_KEY_STORAGE) : null;
}

/** Tras vincular: las próximas consultas anónimas (si cierra sesión) van a una sesión nueva. */
export function rotateSessionKey() {
  memoryKey = null;
  write(SESSION_KEY_STORAGE, null);
  write(SESSION_USED_STORAGE, null);
}

export const isHistoryOptedOut = () => read(OPT_OUT_STORAGE) === '1';

/** Preferencia "No guardar mis consultas" (solo aplica sin cuenta). */
export function useHistoryOptOut() {
  const [optedOut, setOptedOutState] = useState(isHistoryOptedOut);
  const setOptedOut = useCallback((value: boolean) => {
    setOptedOutState(value);
    write(OPT_OUT_STORAGE, value ? '1' : null);
  }, []);
  return [optedOut, setOptedOut] as const;
}
