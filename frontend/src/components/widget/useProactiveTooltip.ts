import { useCallback, useEffect, useState } from 'react';

export const TOOLTIP_DISMISSED_KEY = 'chat_tooltip_dismissed';
/** Espera antes de invitar: que la persona vea primero la página. */
export const TOOLTIP_DELAY_MS = 4000;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(TOOLTIP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Globo de invitación del botón flotante: aparece una vez tras una demora y, si la persona
 * lo cierra o abre el chat desde el botón, no vuelve a aparecer (se recuerda en el navegador).
 * Con el chat abierto nunca se muestra.
 */
export function useProactiveTooltip(isOpen: boolean, delayMs = TOOLTIP_DELAY_MS) {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [ready, setReady] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(TOOLTIP_DISMISSED_KEY, '1');
    } catch {
      // Sin persistencia: vuelve a invitar en la próxima visita.
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [dismissed, delayMs]);

  const visible = ready && !dismissed && !isOpen;

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, dismiss]);

  return { visible, dismiss };
}
