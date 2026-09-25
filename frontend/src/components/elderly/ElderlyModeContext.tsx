import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ELDERLY_CLASS,
  ELDERLY_STORAGE_KEY,
  ElderlyModeContext,
  LEGACY_PROTECTOR_KEY,
  readElderlyMode,
} from './elderlyMode';

/** Modo Abuelo: letra de 22px, alto contraste y vista simplificada (estilos en index.css bajo .modo-abuelo). */
export function ElderlyModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readElderlyMode);

  useEffect(() => {
    document.documentElement.classList.toggle(ELDERLY_CLASS, enabled);

    try {
      localStorage.setItem(ELDERLY_STORAGE_KEY, String(enabled));
      localStorage.removeItem(LEGACY_PROTECTOR_KEY);
    } catch {
      // Sin persistencia: el modo dura solo esta visita.
    }
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((current) => !current), []);
  const value = useMemo(() => ({ enabled, setEnabled, toggle }), [enabled, toggle]);

  return <ElderlyModeContext.Provider value={value}>{children}</ElderlyModeContext.Provider>;
}
