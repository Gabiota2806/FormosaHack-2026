import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { 
  ChatAnalysisResponse, 
  IncidentPaginationResponse, 
  IncidentItem,
  IncidentStats,
  OfficialChannel 
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
      toast.error('No se pudo conectar con el servidor. Verifique su conexión de red.');
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
  analyzeMessage: async (message: string): Promise<ChatAnalysisResponse> => {
    const res = await api.post<ChatAnalysisResponse>('/api/core/chat/message', { message });
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
