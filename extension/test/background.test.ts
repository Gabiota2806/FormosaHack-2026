import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupChromeMock } from './mocks/chrome.js';
import {
  MENU_ITEM_ID,
  STORAGE_KEY_LATEST,
  initializeContextMenu,
  extractPayloadFromClick,
  handleContextMenuClick,
  executeAnalysisPipeline,
} from '../src/background/service-worker.js';
import { AnalysisStorageItem } from '../src/types/extension.js';

describe('Suite de Fondo (Background Service Worker)', () => {
  let chromeMock: ReturnType<typeof setupChromeMock>;

  beforeEach(() => {
    chromeMock = setupChromeMock();
  });

  describe('Registro del Menú Contextual', () => {
    it('debe limpiar items previos y registrar el item de CiberGuardián con id y contextos correctos', () => {
      initializeContextMenu();

      expect(chromeMock.contextMenus.removeAll).toHaveBeenCalled();
      expect(chromeMock.contextMenus.create).toHaveBeenCalledWith({
        id: MENU_ITEM_ID,
        title: 'Analizar con CiberGuardián',
        contexts: ['selection', 'link'],
      });
      expect(chromeMock.contextMenus._createdMenus.length).toBe(1);
      expect(chromeMock.contextMenus._createdMenus[0].id).toBe(MENU_ITEM_ID);
    });

    it('no debe fallar si chrome o chrome.contextMenus no están definidos', () => {
      const originalChrome = (globalThis as unknown as { chrome: unknown }).chrome;
      (globalThis as unknown as { chrome: unknown }).chrome = undefined;

      expect(() => initializeContextMenu()).not.toThrow();

      (globalThis as unknown as { chrome: unknown }).chrome = originalChrome;
    });
  });

  describe('Extracción de Payload desde Clic Contextual', () => {
    it('debe priorizar selectionText cuando ambos (texto y link) están presentes', () => {
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        selectionText: '  Urgente: ingrese a su cuenta bancaria  ',
        linkUrl: 'https://banco-trucho.com/login',
        pageUrl: 'https://mail.com',
      } as chrome.contextMenus.OnClickData;

      expect(extractPayloadFromClick(clickData)).toBe('  Urgente: ingrese a su cuenta bancaria  ');
    });

    it('debe extraer linkUrl si no hay selección de texto', () => {
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        selectionText: '',
        linkUrl: 'https://banco-trucho.com/promo',
        pageUrl: 'https://mail.com',
      } as chrome.contextMenus.OnClickData;

      expect(extractPayloadFromClick(clickData)).toBe('https://banco-trucho.com/promo');
    });

    it('debe retornar cadena vacía si no hay texto ni enlace', () => {
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        pageUrl: 'https://mail.com',
      } as chrome.contextMenus.OnClickData;

      expect(extractPayloadFromClick(clickData)).toBe('');
    });
  });

  describe('handleContextMenuClick', () => {
    it('debe lanzar un error si el menuItemId no coincide', async () => {
      const clickData = {
        menuItemId: 'otro-item-invalido',
        selectionText: 'prueba',
        pageUrl: 'https://example.com',
      } as chrome.contextMenus.OnClickData;

      await expect(handleContextMenuClick(clickData)).rejects.toThrow('Item de menú desconocido');
    });

    it('debe persistir error y fijar badge rojo si el texto es menor a 3 caracteres', async () => {
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        selectionText: 'ab',
        pageUrl: 'https://chat.whatsapp.com',
      } as chrome.contextMenus.OnClickData;

      const item = await handleContextMenuClick(clickData);

      expect(item.status).toBe('error');
      expect(item.errorMessage).toContain('demasiado corto');
      expect(chromeMock.action._getBadgeText()).toBe('!');
      expect(chromeMock.action._getBadgeColor()).toBe('#EF4444');

      const storage = await chromeMock.storage.local.get(STORAGE_KEY_LATEST);
      const storedItem = storage[STORAGE_KEY_LATEST] as AnalysisStorageItem;
      expect(storedItem.status).toBe('error');
      expect(storedItem.errorMessage).toContain('demasiado corto');
    });

    it('debe marcar error si el texto seleccionado excede el límite de 2000 caracteres', async () => {
      const oversizedText = 'A'.repeat(2500);
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        selectionText: oversizedText,
        pageUrl: 'https://noticias-formosa.com',
      } as chrome.contextMenus.OnClickData;

      const item = await handleContextMenuClick(clickData);

      expect(item.status).toBe('error');
      expect(item.errorMessage).toContain('excede el límite permitido');
      expect(chromeMock.action._getBadgeText()).toBe('!');
      expect(chromeMock.action._getBadgeColor()).toBe('#EF4444');
    });

    it('debe capturar título y URL de la pestaña activa', async () => {
      const clickData = {
        menuItemId: MENU_ITEM_ID,
        selectionText: 'Reclame su bono provincial ingresando aquí',
        pageUrl: 'https://facebook.com',
      } as chrome.contextMenus.OnClickData;

      const tab = {
        id: 42,
        url: 'https://facebook.com/publicacion-sospechosa',
        title: 'Comunidad Formosa Noticias',
      } as chrome.tabs.Tab;

      const item = await handleContextMenuClick(clickData, tab);

      expect(item.sourceUrl).toBe('https://facebook.com/publicacion-sospechosa');
      expect(item.sourceTitle).toBe('Comunidad Formosa Noticias');
      expect(item.status).toBe('pending');
      expect(chromeMock.action._getBadgeText()).toBe('...');
      expect(chromeMock.action._getBadgeColor()).toBe('#3B82F6');
    });
  });

  describe('Pipeline de Análisis y Clasificación de Riesgo', () => {
    it('debe procesar análisis exitoso con riesgo ALTO y actualizar badge en rojo (#EF4444)', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-high-risk',
        text: 'Banco Formosa: Ingrese su token urgente para evitar la baja de su cuenta',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 72,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: true,
          data: {
            risk_level: 'HIGH',
            risk_percentage: 95,
            detected_entity: 'Banco Formosa',
            detected_vector: 'WHATSAPP',
            summary: 'Ataque de phishing bancario crítico',
            immediate_action: 'No ingrese claves ni tokens',
            what_not_to_do: 'No comparta información confidencial',
            highlighted_phrases: ['token urgente'],
            wa_share_text: '¡Cuidado con este mensaje de Banco Formosa!',
          },
          isOfflineFallback: false,
        }),
      };

      const analyzed = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(analyzed.status).toBe('analyzed');
      expect(analyzed.result?.risk_level).toBe('HIGH');
      expect(analyzed.result?.detected_entity).toBe('Banco Formosa');
      expect(analyzed.isOffline).toBe(false);

      expect(chromeMock.action._getBadgeText()).toBe('ALTO');
      expect(chromeMock.action._getBadgeColor()).toBe('#EF4444');

      const stored = (await chromeMock.storage.local.get(STORAGE_KEY_LATEST))[STORAGE_KEY_LATEST] as AnalysisStorageItem;
      expect(stored.status).toBe('analyzed');
      expect(stored.result?.risk_level).toBe('HIGH');
    });

    it('debe procesar análisis exitoso con riesgo MEDIO y actualizar badge en ámbar (#F59E0B)', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-med-risk',
        text: 'Gana un premio respondiendo esta encuesta en 5 minutos',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 52,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: true,
          data: {
            risk_level: 'MEDIUM',
            risk_percentage: 60,
            detected_entity: null,
            detected_vector: 'WEB',
            summary: 'Posible spam o captación de leads dudosa',
            immediate_action: 'No brinde datos personales',
            what_not_to_do: 'No descargue archivos adjuntos',
            highlighted_phrases: ['premio'],
            wa_share_text: 'Alerta',
          },
          isOfflineFallback: false,
        }),
      };

      const analyzed = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(analyzed.status).toBe('analyzed');
      expect(chromeMock.action._getBadgeText()).toBe('MED');
      expect(chromeMock.action._getBadgeColor()).toBe('#F59E0B');
    });

    it('debe procesar análisis exitoso con riesgo BAJO y actualizar badge en verde (#10B981)', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-low-risk',
        text: 'Hola Juan, recordá que mañana a las 10 hs tenemos la reunión de equipo.',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 71,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: true,
          data: {
            risk_level: 'LOW',
            risk_percentage: 10,
            detected_entity: null,
            detected_vector: 'EMAIL',
            summary: 'Mensaje legítimo sin indicios maliciosos',
            immediate_action: 'Ninguna',
            what_not_to_do: 'Ninguna',
            highlighted_phrases: [],
            wa_share_text: 'Mensaje seguro',
          },
          isOfflineFallback: false,
        }),
      };

      const analyzed = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(analyzed.status).toBe('analyzed');
      expect(chromeMock.action._getBadgeText()).toBe('BAJO');
      expect(chromeMock.action._getBadgeColor()).toBe('#10B981');
    });

    it('debe manejar fallback offline cuando el backend no responde marcando isOffline: true', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-offline-fallback',
        text: 'ANSES: cobro extraordinario disponible, haga clic en el siguiente enlace',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 72,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: true,
          data: {
            risk_level: 'HIGH',
            risk_percentage: 85,
            detected_entity: 'ANSES',
            detected_vector: 'SMS',
            summary: 'Detección offline preventiva: estafa de cobro falso de ANSES',
            immediate_action: 'No comparta datos',
            what_not_to_do: 'No ingrese al enlace',
            highlighted_phrases: ['ANSES', 'cobro extraordinario'],
            wa_share_text: 'Alerta',
          },
          isOfflineFallback: true,
        }),
      };

      const analyzed = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(analyzed.status).toBe('analyzed');
      expect(analyzed.isOffline).toBe(true);
      expect(chromeMock.action._getBadgeText()).toBe('ALTO');

      const stored = (await chromeMock.storage.local.get(STORAGE_KEY_LATEST))[STORAGE_KEY_LATEST] as AnalysisStorageItem;
      expect(stored.isOffline).toBe(true);
    });

    it('debe manejar errores de respuesta de la API y asignar badge de error', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-api-error',
        text: 'Texto de prueba que provocará error en el servidor',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 50,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: false,
          error: 'Servidor no disponible (503)',
        }),
      };

      const item = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(item.status).toBe('error');
      expect(item.errorMessage).toBe('Servidor no disponible (503)');
      expect(chromeMock.action._getBadgeText()).toBe('!');
      expect(chromeMock.action._getBadgeColor()).toBe('#EF4444');
    });

    it('debe capturar excepciones no controladas en el cliente HTTP', async () => {
      const pendingItem: AnalysisStorageItem = {
        id: 'test-exception',
        text: 'Texto que lanza excepción de red incontrolada',
        timestamp: Date.now(),
        status: 'pending',
        charCount: 45,
      };

      const mockClient = {
        analyzeMessage: vi.fn().mockRejectedValue(new Error('Network Connection Refused')),
      };

      const item = await executeAnalysisPipeline(pendingItem, mockClient as any);

      expect(item.status).toBe('error');
      expect(item.errorMessage).toBe('Network Connection Refused');
      expect(chromeMock.action._getBadgeText()).toBe('!');
    });
  });

  describe('Integración de Flujo Completo con Clic Contextual', () => {
    it('handleContextMenuClick con autoAnalyze: true debe ejecutar el flujo de punta a punta', async () => {
      const info = {
        menuItemId: MENU_ITEM_ID,
        selectionText: 'Estimado cliente de Banco Formosa, valide sus claves aquí',
        pageUrl: 'https://web.whatsapp.com',
      } as chrome.contextMenus.OnClickData;

      const mockClient = {
        analyzeMessage: vi.fn().mockResolvedValue({
          success: true,
          data: {
            risk_level: 'HIGH',
            risk_percentage: 90,
            detected_entity: 'Banco Formosa',
            detected_vector: 'WHATSAPP',
            summary: 'Phishing por suplantación bancaria',
            immediate_action: 'Bloquee el remitente',
            what_not_to_do: 'No ingrese claves',
            highlighted_phrases: ['valide sus claves'],
            wa_share_text: 'Alerta',
          },
          isOfflineFallback: false,
        }),
      };

      const item = await handleContextMenuClick(info, undefined, { autoAnalyze: true, client: mockClient as any });

      expect(item.status).toBe('analyzed');
      expect(item.result?.detected_entity).toBe('Banco Formosa');
      expect(chromeMock.action._getBadgeText()).toBe('ALTO');

      const inStorage = (await chromeMock.storage.local.get(STORAGE_KEY_LATEST))[STORAGE_KEY_LATEST] as AnalysisStorageItem;
      expect(inStorage.result?.detected_entity).toBe('Banco Formosa');
    });
  });
});
