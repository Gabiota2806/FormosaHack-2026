import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

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
