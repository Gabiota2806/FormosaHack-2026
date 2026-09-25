import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CoreApiClient,
  analyzeMessageOfflineFallback,
  getRiskBadgeConfig,
  updateBadgeForRisk,
  saveAnalysisToStorage,
  getLatestAnalysisFromStorage,
  DEFAULT_STORAGE_KEY,
} from '../src/services/api-client.js';
import type { ChatMessageResponse } from '../src/types/analysis.js';
import type { AnalysisStorageItem } from '../src/types/extension.js';

describe('Heurística Offline - analyzeMessageOfflineFallback', () => {
  it('debe detectar suplantación de Banco Formosa con urgencia y claves como riesgo HIGH', () => {
    const input = 'Banco Formosa: urgente, ingrese su token y clave para evitar el bloqueo inmediato de su cuenta https://falso-link.com';
    const result = analyzeMessageOfflineFallback(input);

    expect(result.risk_level).toBe('HIGH');
    expect(result.risk_percentage).toBeGreaterThanOrEqual(50);
    expect(result.detected_entity).toBe('Banco Formosa');
    expect(result.summary).toContain('[Modo Offline]');
    expect(result.summary).toContain('Riesgo Alto');
    expect(result.highlighted_phrases.length).toBeGreaterThan(0);
    expect(result.wa_share_text).toContain('Banco Formosa');
  });

  it('debe detectar suplantación familiar "Hola má" con riesgo HIGH', () => {
    const input = 'Hola má, cambié de número porque se rompió mi teléfono. Pasame plata por favor';
    const result = analyzeMessageOfflineFallback(input);

    expect(result.risk_level).toBe('HIGH');
    expect(result.risk_percentage).toBeGreaterThanOrEqual(60);
    const familyPhrase = result.highlighted_phrases.find((p) => p.category === 'FAMILY_IMPERSONATION');
    expect(familyPhrase).toBeDefined();
  });

  it('debe catalogar urgencia moderada sin credenciales como riesgo MEDIUM', () => {
    const input = 'Aviso de vencimiento urgente de trámite administrativo en las próximas 24 horas.';
    const result = analyzeMessageOfflineFallback(input);

    expect(result.risk_level).toBe('MEDIUM');
    expect(result.risk_percentage).toBeGreaterThanOrEqual(25);
    expect(result.risk_percentage).toBeLessThan(50);
  });

  it('debe catalogar un mensaje cotidiano inocuo como riesgo LOW', () => {
    const input = 'Hola Gabriel, ¿nos encontramos mañana a las 9 am en la biblioteca para estudiar?';
    const result = analyzeMessageOfflineFallback(input);

    expect(result.risk_level).toBe('LOW');
    expect(result.risk_percentage).toBeLessThan(25);
    expect(result.detected_entity).toBeNull();
  });

  it('debe detectar enlaces sospechosos e incluirlos en frases destacadas', () => {
    const input = 'Accedé a tu premio en bit.ly/premio-gratis ahora mismo';
    const result = analyzeMessageOfflineFallback(input);

    const linkPhrase = result.highlighted_phrases.find((p) => p.category === 'FAKE_LINK');
    expect(linkPhrase).toBeDefined();
    expect(linkPhrase?.phrase).toContain('bit.ly/premio-gratis');
  });
});

describe('CoreApiClient - Integración HTTP y Fallback Resiliente', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('debe retornar respuesta estructurada online cuando el backend responde 200 OK', async () => {
    const mockBackendResponse: ChatMessageResponse = {
      risk_level: 'HIGH',
      risk_percentage: 95,
      detected_entity: 'Banco Formosa',
      detected_vector: 'WHATSAPP',
      summary: 'Estafa detectada por Gemini AI',
      immediate_action: 'Bloquee al remitente',
      what_not_to_do: 'No comparta el token',
      highlighted_phrases: [],
      wa_share_text: 'Alerta CiberGuardián',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBackendResponse,
    });

    const client = new CoreApiClient({ baseUrl: 'http://localhost:8000' });
    const result = await client.analyzeMessage('Urgente Banco Formosa token');

    expect(result.success).toBe(true);
    expect(result.isOfflineFallback).toBe(false);
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual(mockBackendResponse);
  });

  it('debe activar el fallback heurístico offline cuando la solicitud excede el timeout (AbortError)', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const client = new CoreApiClient({
      baseUrl: 'http://localhost:8000',
      timeoutMs: 100,
      enableOfflineFallback: true,
    });

    const result = await client.analyzeMessage('Alerta urgente Banco Formosa token clave');

    expect(result.success).toBe(true);
    expect(result.isOfflineFallback).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.detected_entity).toBe('Banco Formosa');
    expect(result.error).toContain('Tiempo de espera agotado');
  });

  it('debe activar el fallback offline cuando ocurre un error de red (backend caído)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (ECONNREFUSED)'));

    const client = new CoreApiClient({
      baseUrl: 'http://localhost:8000',
      enableOfflineFallback: true,
    });

    const result = await client.analyzeMessage('Hola pá cambié de número');

    expect(result.success).toBe(true);
    expect(result.isOfflineFallback).toBe(true);
    expect(result.data?.risk_level).toBe('HIGH');
    expect(result.error).toContain('Failed to fetch');
  });

  it('debe retornar error sin fallback si enableOfflineFallback es false', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const client = new CoreApiClient({
      baseUrl: 'http://localhost:8000',
      enableOfflineFallback: false,
    });

    const result = await client.analyzeMessage('Texto de prueba');

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('Network error');
  });

  it('debe degradar suavemente al fallback heurístico si el backend retorna HTTP 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Error interno en Gemini' }),
    });

    const client = new CoreApiClient({
      baseUrl: 'http://localhost:8000',
      enableOfflineFallback: true,
    });

    const result = await client.analyzeMessage('Urgente Banco Formosa');

    expect(result.success).toBe(true);
    expect(result.isOfflineFallback).toBe(true);
    expect(result.statusCode).toBe(500);
    expect(result.data?.detected_entity).toBe('Banco Formosa');
  });
});

describe('Utilidades de Badge y Storage', () => {
  let mockStorage: Record<string, unknown> = {};
  let badgeText = '';
  let badgeColor = '';

  beforeEach(() => {
    mockStorage = {};
    badgeText = '';
    badgeColor = '';

    (globalThis as unknown as { chrome: unknown }).chrome = {
      action: {
        setBadgeText: vi.fn(async ({ text }: { text: string }) => {
          badgeText = text;
        }),
        setBadgeBackgroundColor: vi.fn(async ({ color }: { color: string }) => {
          badgeColor = color;
        }),
      },
      storage: {
        local: {
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(mockStorage, items);
          }),
          get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
        },
      },
    };
  });

  it('getRiskBadgeConfig debe mapear correctamente los semáforos de riesgo', () => {
    expect(getRiskBadgeConfig('HIGH')).toEqual({ text: 'ALTO', color: '#EF4444' });
    expect(getRiskBadgeConfig('MEDIUM')).toEqual({ text: 'MED', color: '#F59E0B' });
    expect(getRiskBadgeConfig('LOW')).toEqual({ text: 'BAJO', color: '#10B981' });
    expect(getRiskBadgeConfig('error')).toEqual({ text: '!', color: '#EF4444' });
    expect(getRiskBadgeConfig('pending')).toEqual({ text: '...', color: '#3B82F6' });
  });

  it('updateBadgeForRisk debe invocar la API de chrome.action', async () => {
    await updateBadgeForRisk('HIGH');
    expect(badgeText).toBe('ALTO');
    expect(badgeColor).toBe('#EF4444');

    await updateBadgeForRisk('LOW');
    expect(badgeText).toBe('BAJO');
    expect(badgeColor).toBe('#10B981');
  });

  it('saveAnalysisToStorage y getLatestAnalysisFromStorage deben persistir y recuperar items', async () => {
    const item: AnalysisStorageItem = {
      id: 'test-123',
      text: 'Texto de prueba',
      timestamp: Date.now(),
      status: 'analyzed',
      charCount: 15,
      isOffline: true,
    };

    await saveAnalysisToStorage(item);
    const retrieved = await getLatestAnalysisFromStorage();

    expect(retrieved).toEqual(item);
    expect(mockStorage[DEFAULT_STORAGE_KEY]).toEqual(item);
  });
});
