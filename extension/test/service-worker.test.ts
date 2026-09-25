import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MENU_ITEM_ID,
  STORAGE_KEY_LATEST,
  initializeContextMenu,
  extractPayloadFromClick,
  handleContextMenuClick,
  executeAnalysisPipeline,
} from '../src/background/service-worker.js';

describe('Service Worker - Context Menu & Storage', () => {
  let mockStorage: Record<string, unknown> = {};
  let mockBadgeText = '';
  let mockBadgeColor = '';

  beforeEach(() => {
    mockStorage = {};
    mockBadgeText = '';
    mockBadgeColor = '';

    // Mock global chrome API
    (globalThis as unknown as { chrome: unknown }).chrome = {
      contextMenus: {
        removeAll: vi.fn((cb?: () => void) => cb && cb()),
        create: vi.fn(),
      },
      action: {
        setBadgeText: vi.fn(async ({ text }: { text: string }) => {
          mockBadgeText = text;
        }),
        setBadgeBackgroundColor: vi.fn(async ({ color }: { color: string }) => {
          mockBadgeColor = color;
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

  it('initializeContextMenu debe purgar items previos y registrar el item con ID correcto', () => {
    initializeContextMenu();

    expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: MENU_ITEM_ID,
      title: 'Analizar con CiberGuardián',
      contexts: ['selection', 'link'],
    });
  });

  it('extractPayloadFromClick debe priorizar selectionText sobre linkUrl', () => {
    const infoSelection = {
      menuItemId: MENU_ITEM_ID,
      selectionText: 'Texto seleccionado de prueba',
      pageUrl: 'https://example.com',
    } as chrome.contextMenus.OnClickData;

    expect(extractPayloadFromClick(infoSelection)).toBe('Texto seleccionado de prueba');

    const infoLink = {
      menuItemId: MENU_ITEM_ID,
      linkUrl: 'https://sitio-sospechoso.com',
      pageUrl: 'https://example.com',
    } as chrome.contextMenus.OnClickData;

    expect(extractPayloadFromClick(infoLink)).toBe('https://sitio-sospechoso.com');
  });

  it('handleContextMenuClick debe persistir estado pending y configurar badge azul si el texto es válido', async () => {
    const info = {
      menuItemId: MENU_ITEM_ID,
      selectionText: 'Transfiera fondos urgentemente al siguiente CBU',
      pageUrl: 'https://mail.google.com',
    } as chrome.contextMenus.OnClickData;

    const tab = {
      id: 1,
      url: 'https://mail.google.com/mail/u/0/#inbox',
      title: 'Bandeja de Entrada - Correo',
    } as chrome.tabs.Tab;

    const item = await handleContextMenuClick(info, tab);

    expect(item.status).toBe('pending');
    expect(item.text).toBe('Transfiera fondos urgentemente al siguiente CBU');
    expect(item.sourceUrl).toBe('https://mail.google.com/mail/u/0/#inbox');
    expect(item.sourceTitle).toBe('Bandeja de Entrada - Correo');
    expect(mockBadgeText).toBe('...');
    expect(mockBadgeColor).toBe('#3B82F6');

    const stored = mockStorage[STORAGE_KEY_LATEST] as typeof item;
    expect(stored).toBeDefined();
    expect(stored.text).toBe('Transfiera fondos urgentemente al siguiente CBU');
    expect(stored.status).toBe('pending');
  });

  it('handleContextMenuClick debe persistir estado error y configurar badge rojo si el texto es muy corto', async () => {
    const info = {
      menuItemId: MENU_ITEM_ID,
      selectionText: 'ok',
      pageUrl: 'https://chat.whatsapp.com',
    } as chrome.contextMenus.OnClickData;

    const item = await handleContextMenuClick(info);

    expect(item.status).toBe('error');
    expect(item.errorMessage).toContain('demasiado corto');
    expect(mockBadgeText).toBe('!');
    expect(mockBadgeColor).toBe('#EF4444');

    const stored = mockStorage[STORAGE_KEY_LATEST] as typeof item;
    expect(stored).toBeDefined();
    expect(stored.status).toBe('error');
  });

  it('executeAnalysisPipeline debe actualizar el item a analyzed y configurar el badge con el nivel de riesgo', async () => {
    const pendingItem = {
      id: 'test-item-1',
      text: 'Banco Formosa: ingrese su token para evitar bloqueo inmediato',
      timestamp: Date.now(),
      status: 'pending' as const,
      charCount: 60,
    };

    const mockClient = {
      analyzeMessage: vi.fn().mockResolvedValue({
        success: true,
        data: {
          risk_level: 'HIGH',
          risk_percentage: 90,
          detected_entity: 'Banco Formosa',
          detected_vector: 'WHATSAPP',
          summary: 'Intento de estafa detectado',
          immediate_action: 'No transfiera',
          what_not_to_do: 'No comparta clave',
          highlighted_phrases: [],
          wa_share_text: 'Alerta',
        },
        isOfflineFallback: false,
      }),
    };

    const analyzedItem = await executeAnalysisPipeline(pendingItem, mockClient as any);

    expect(analyzedItem.status).toBe('analyzed');
    expect(analyzedItem.result?.risk_level).toBe('HIGH');
    expect(analyzedItem.isOffline).toBe(false);
    expect(mockBadgeText).toBe('ALTO');
    expect(mockBadgeColor).toBe('#EF4444');

    const stored = mockStorage[STORAGE_KEY_LATEST] as typeof analyzedItem;
    expect(stored.status).toBe('analyzed');
    expect(stored.result?.detected_entity).toBe('Banco Formosa');
  });

  it('handleContextMenuClick con autoAnalyze: true debe ejecutar el flujo completo y almacenar el resultado', async () => {
    const info = {
      menuItemId: MENU_ITEM_ID,
      selectionText: 'Hola má, cambié de número',
      pageUrl: 'https://web.whatsapp.com',
    } as chrome.contextMenus.OnClickData;

    const mockClient = {
      analyzeMessage: vi.fn().mockResolvedValue({
        success: true,
        data: {
          risk_level: 'HIGH',
          risk_percentage: 85,
          detected_entity: null,
          detected_vector: 'WHATSAPP',
          summary: 'Suplantación familiar',
          immediate_action: 'Llamar al familiar',
          what_not_to_do: 'No transferir',
          highlighted_phrases: [],
          wa_share_text: 'Alerta',
        },
        isOfflineFallback: true,
      }),
    };

    const item = await handleContextMenuClick(info, undefined, { autoAnalyze: true, client: mockClient as any });

    expect(item.status).toBe('analyzed');
    expect(item.isOffline).toBe(true);
    expect(mockBadgeText).toBe('ALTO');
  });
});
