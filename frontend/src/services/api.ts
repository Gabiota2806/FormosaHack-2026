import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { 
  ChatAnalysisResponse, 
  ChatFollowupRequest,
  ChatFollowupResponse,
  IncidentPaginationResponse, 
  IncidentItem,
  IncidentStats,
  OfficialChannel,
  User,
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  TOTPSetupResponse,
  TOTPVerifyResponse,
  ChatHistoryEntry,
  ChatHistoryPage,
  ChatSessionOut,
} from '../types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Sin toast de error: quien hace el pedido maneja la falla (p. ej. métricas de fondo). */
    silent?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para inyectar token JWT y resolución multi-servicio en Render / Gateway
api.interceptors.request.use((config) => {
  const authUrl = import.meta.env.VITE_AUTH_API_URL;
  const coreUrl = import.meta.env.VITE_CORE_API_URL;

  // Si se configuran microservicios independientes (ej: Render Cloud)
  if (authUrl && config.url?.startsWith('/api/auth')) {
    config.baseURL = authUrl.startsWith('http') ? authUrl : `https://${authUrl}`;
    config.url = config.url.replace(/^\/api\/auth/, '');
  } else if (coreUrl && config.url?.startsWith('/api/core')) {
    config.baseURL = coreUrl.startsWith('http') ? coreUrl : `https://${coreUrl}`;
    config.url = config.url.replace(/^\/api\/core/, '');
  }

  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo amigable de errores HTTP
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    // Pedidos cancelados a propósito (AbortController) o marcados como silent: no se avisa al usuario.
    if (axios.isCancel(error) || error.config?.silent) {
      return Promise.reject(error);
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('La consulta tardó más de lo esperado. Por favor, intente nuevamente.');
      } else {
        toast.error('No se pudo conectar con el servidor. Verifique su conexión de red.');
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.detail || 'Ocurrió un error inesperado en la solicitud.';

    switch (status) {
      case 400:
        toast.error(`Datos inválidos: ${message}`);
        break;
      case 401:
        toast.error('Sesión expirada o credenciales inválidas.');
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        break;
      case 403:
        toast.error('No tiene permisos suficientes para realizar esta acción.');
        break;
      case 404:
        toast.error('El recurso solicitado no fue encontrado.');
        break;
      case 429:
        toast.error('Demasiadas solicitudes. Por favor espere un momento antes de reintentar.');
        break;
      case 500:
        toast.error('Error interno del servidor. Por favor intente más tarde.');
        break;
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Funciones específicas del dominio CiberGuardián
export const chatApi = {
  /**
   * Con sessionKey, el backend guarda la consulta en el historial anónimo de esa sesión
   * (para vincularla a la cuenta al iniciar sesión). Sin ella, solo se guarda si hay sesión iniciada.
   */
  analyzeMessage: async (message: string, sessionKey?: string): Promise<ChatAnalysisResponse> => {
    const res = await api.post<ChatAnalysisResponse>(
      '/api/core/chat/message',
      { message },
      {
        timeout: 35000,
        headers: sessionKey ? { 'X-Session-Key': sessionKey } : undefined,
      },
    );
    return res.data;
  },
  followUp: async (request: ChatFollowupRequest): Promise<ChatFollowupResponse> => {
    const res = await api.post<ChatFollowupResponse>('/api/core/chat/followup', request, {
      timeout: 35000,
    });
    return res.data;
  },
};

export const incidentApi = {
  getIncidents: async (params?: {
    page?: number;
    limit?: number;
    entity?: string;
    vector?: string;
    search?: string;
  }, signal?: AbortSignal): Promise<IncidentPaginationResponse> => {
    const res = await api.get<IncidentPaginationResponse>('/api/core/incidents', { params, signal });
    return res.data;
  },
  voteIncident: async (incidentId: number, fingerprint: string) => {
    const res = await api.post<{ success: boolean; votes_count: number; message: string }>(
      `/api/core/incidents/${incidentId}/me-too`,
      { user_fingerprint: fingerprint }
    );
    return res.data;
  },
  createIncident: async (data: Partial<IncidentItem>) => {
    const res = await api.post<IncidentItem>('/api/core/incidents', data);
    return res.data;
  },
  getStats: async (signal?: AbortSignal): Promise<IncidentStats> => {
    const res = await api.get<IncidentStats>('/api/core/incidents/stats', { signal, silent: true });
    return res.data;
  },
  getVerifiedChannels: async (): Promise<OfficialChannel[]> => {
    const res = await api.get<OfficialChannel[]>('/api/core/incidents/channels/verified');
    return res.data;
  },
};

/** Suscripción tal como la serializa PushSubscription.toJSON(), más datos del dispositivo. */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  user_agent?: string;
}

export const pushApi = {
  /** Clave pública VAPID; llega vacía si el servidor no tiene las claves configuradas. */
  getVapidPublicKey: async (): Promise<string> => {
    const res = await api.get<{ vapid_public_key: string }>('/api/core/push/vapid-public-key', { silent: true });
    return res.data.vapid_public_key;
  },
  subscribe: async (payload: PushSubscriptionPayload) => {
    await api.post('/api/core/push/subscribe', payload, { silent: true });
  },
  unsubscribe: async (endpoint: string) => {
    await api.delete('/api/core/push/subscriptions', { data: { endpoint }, silent: true });
  },
};

export const authApi = {
  register: async (payload: RegisterPayload): Promise<User> => {
    const res = await api.post<User>('/api/auth/register', payload);
    return res.data;
  },
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const res = await api.post<TokenResponse>('/api/auth/login', payload);
    return res.data;
  },
  getMe: async (signal?: AbortSignal, silent = false): Promise<User> => {
    const res = await api.get<User>('/api/auth/me', { signal, silent });
    return res.data;
  },
  setup2FA: async (): Promise<TOTPSetupResponse> => {
    const res = await api.post<TOTPSetupResponse>('/api/auth/2fa/setup');
    return res.data;
  },
  verify2FA: async (code: string): Promise<TOTPVerifyResponse> => {
    const res = await api.post<TOTPVerifyResponse>('/api/auth/2fa/verify', { code });
    return res.data;
  },
};

export const historyApi = {
  list: async (
    params?: { page?: number; limit?: number },
    signal?: AbortSignal
  ): Promise<ChatHistoryPage> => {
    const res = await api.get<ChatHistoryPage>('/api/core/chat/history', { params, signal });
    return res.data;
  },
  getEntry: async (id: number, signal?: AbortSignal): Promise<ChatHistoryEntry> => {
    const res = await api.get<ChatHistoryEntry>(`/api/core/chat/history/${id}`, { signal });
    return res.data;
  },
  deleteEntry: async (id: number): Promise<{ message: string; id: number; deleted: boolean }> => {
    const res = await api.delete<{ message: string; id: number; deleted: boolean }>(
      `/api/core/chat/history/${id}`
    );
    return res.data;
  },
  claim: async (session_key: string): Promise<ChatSessionOut> => {
    const res = await api.post<ChatSessionOut>('/api/core/chat/history/claim', { session_key });
    return res.data;
  },
};

