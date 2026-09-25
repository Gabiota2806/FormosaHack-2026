import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { isHistoryOptedOut, rotateSessionKey, sessionKeyToClaim } from '../chat/historyPreference';

/**
 * Auto-claim silencioso (FH26-89, Escenario 3 de US-16): cuando la persona inicia sesión,
 * las consultas que hizo sin cuenta en este navegador pasan a su historial personal.
 * Solo reacciona al paso "sin sesión → con sesión"; abrir la app ya logueado no vincula nada.
 */
export function useAutoClaim() {
  const { isAuthenticated, isLoading, claimAnonymousSession } = useAuth();
  const wasAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const before = wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;
    if (before !== false || !isAuthenticated) return;

    const sessionKey = sessionKeyToClaim();
    if (!sessionKey || isHistoryOptedOut()) return;

    claimAnonymousSession(sessionKey).then((claimed) => {
      if (!claimed) return;
      rotateSessionKey();
      toast.success('Consulta guardada en tu historial personal.');
    });
  }, [isAuthenticated, isLoading, claimAnonymousSession]);
}
