import { useEffect, useState } from 'react';

// Misma clave que el script inline de index.html, que aplica el modo antes del primer render.
export const PROTECTOR_STORAGE_KEY = 'protector_mode';

export function readProtectorMode(): boolean {
  try {
    return localStorage.getItem(PROTECTOR_STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

/** Modo Protector Mayor: letra XL y alto contraste (estilos en index.css bajo [data-protector]). */
export function useProtectorMode() {
  const [enabled, setEnabled] = useState(readProtectorMode);

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.dataset.protector = 'on';
    else delete root.dataset.protector;

    try {
      localStorage.setItem(PROTECTOR_STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
      // Sin persistencia: el modo dura solo esta visita.
    }
  }, [enabled]);

  return [enabled, setEnabled] as const;
}
