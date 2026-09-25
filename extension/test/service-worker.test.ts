import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MENU_ITEM_ID,
  STORAGE_KEY_LATEST,
  initializeContextMenu,
  extractPayloadFromClick,
  handleContextMenuClick,
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
});
