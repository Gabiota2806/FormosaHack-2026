import { createContext, useContext } from 'react';

// Misma clave y clase que el script inline de index.html, que aplica el modo antes del primer render.
export const ELDERLY_STORAGE_KEY = 'ciberguardian_modo_abuelo';
export const ELDERLY_CLASS = 'modo-abuelo';
// Clave del Modo Protector Mayor (FH26-50), al que reemplaza: quien lo tenía activo no pierde la preferencia.
export const LEGACY_PROTECTOR_KEY = 'protector_mode';

export function readElderlyMode(): boolean {
  try {
    const stored = localStorage.getItem(ELDERLY_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return localStorage.getItem(LEGACY_PROTECTOR_KEY) === 'on';
  } catch {
    return false;
  }
}

export interface ElderlyModeValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const ElderlyModeContext = createContext<ElderlyModeValue | null>(null);

export function useElderlyMode(): ElderlyModeValue {
  const context = useContext(ElderlyModeContext);
  if (!context) throw new Error('useElderlyMode debe usarse dentro de ElderlyModeProvider');
  return context;
}
