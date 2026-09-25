import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi, historyApi } from '../services/api';
import type { 
  User, 
  TOTPSetupResponse, 
} from '../types';

export interface TotpStatus {
  enabled: boolean;
  qrCode: string | null;
  secret: string | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  is2FAPending: boolean;
  tempToken: string | null;
  totpStatus: TotpStatus;
  login: (email: string, password: string, totpCode?: string) => Promise<{ success: boolean; requires2FA?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setup2FA: () => Promise<TOTPSetupResponse | null>;
  verify2FA: (code: string) => Promise<boolean>;
  claimAnonymousSession: (sessionKey: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const TOKEN_STORAGE_KEY = 'access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [is2FAPending, setIs2FAPending] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpStatus, setTotpStatus] = useState<TotpStatus>({
    enabled: false,
    qrCode: null,
    secret: null,
  });

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
    setIs2FAPending(false);
    setTempToken(null);
    setTotpStatus({ enabled: false, qrCode: null, secret: null });
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken) {
      clearAuthState();
      return null;
    }

    try {
      // silent: true para evitar alerta de error si el token expiró antes de iniciar
      const userData = await authApi.getMe(undefined, true);
      setUser(userData);
      setTotpStatus((prev) => ({ ...prev, enabled: !!userData.is_totp_enabled }));
      return userData;
    } catch {
      clearAuthState();
      return null;
    }
  }, [clearAuthState]);

  // Inicialización del usuario al montar el provider
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authApi.getMe(undefined, true);
          if (mounted) {
            setUser(userData);
            setTotpStatus((prev) => ({ ...prev, enabled: !!userData.is_totp_enabled }));
          }
        } catch {
          if (mounted) {
            clearAuthState();
          }
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [clearAuthState]);

  // Manejo reactivo de expiración de sesión (evento auth:expired) y multi-pestaña (storage)
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthState();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        if (!e.newValue) {
          clearAuthState();
        } else if (e.newValue !== token) {
          setToken(e.newValue);
          refreshUser();
        }
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearAuthState, refreshUser, token]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      totpCode?: string
    ): Promise<{ success: boolean; requires2FA?: boolean }> => {
      try {
        const res = await authApi.login({ email, password, totp_code: totpCode });

        if (res.requires_2fa) {
          setIs2FAPending(true);
          setTempToken(res.temp_token || null);
          toast.info('Se requiere código de verificación de Segundo Factor (2FA).');
          return { success: false, requires2FA: true };
        }

        if (res.access_token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
          setToken(res.access_token);
          setIs2FAPending(false);
          setTempToken(null);

          const userData = await authApi.getMe();
          setUser(userData);
          setTotpStatus((prev) => ({ ...prev, enabled: !!userData.is_totp_enabled }));
          toast.success('Sesión iniciada correctamente');
          return { success: true, requires2FA: false };
        }

        return { success: false };
      } catch {
        return { success: false };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      try {
        await authApi.register({ name, email, password });
        toast.success('Usuario registrado con éxito. Ahora podés iniciar sesión.');
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthState();
    toast.info('Sesión cerrada correctamente.');
  }, [clearAuthState]);

  const setup2FA = useCallback(async (): Promise<TOTPSetupResponse | null> => {
    try {
      const res = await authApi.setup2FA();
      setTotpStatus((prev) => ({
        ...prev,
        qrCode: res.qr_code_base64,
        secret: res.secret,
      }));
      toast.success('Código QR generado. Escanealo con Google Authenticator.');
      return res;
    } catch {
      return null;
    }
  }, []);

  const verify2FA = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const res = await authApi.verify2FA(code);
        if (res.is_totp_enabled) {
          setTotpStatus({
            enabled: true,
            qrCode: null,
            secret: null,
          });
          setUser((prev) => (prev ? { ...prev, is_totp_enabled: true } : prev));
          toast.success('¡Segundo Factor (2FA) activado exitosamente!');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const claimAnonymousSession = useCallback(
    async (sessionKey: string): Promise<boolean> => {
      if (!token) return false;
      try {
        await historyApi.claim(sessionKey);
        return true;
      } catch {
        return false;
      }
    },
    [token]
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    is2FAPending,
    tempToken,
    totpStatus,
    login,
    register,
    logout,
    refreshUser,
    setup2FA,
    verify2FA,
    claimAnonymousSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
