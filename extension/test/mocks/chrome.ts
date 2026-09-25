import { vi } from 'vitest';

export interface MockChromeStorage {
  [key: string]: unknown;
}

export function createChromeMock() {
  const storageLocal: MockChromeStorage = {};
  const storageSync: MockChromeStorage = {};
  let currentBadgeText = '';
  let currentBadgeColor = '';
  let currentTitle = '';

  const contextMenuListeners: Array<(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void> = [];
  const installedListeners: Array<(details: chrome.runtime.InstalledDetails) => void> = [];
  const messageListeners: Array<(message: any, sender: any, sendResponse: (res?: any) => void) => void> = [];
  const createdMenus: chrome.contextMenus.CreateProperties[] = [];

  const mock = {
    contextMenus: {
      create: vi.fn((properties: chrome.contextMenus.CreateProperties, callback?: () => void) => {
        createdMenus.push(properties);
        if (callback) callback();
        return properties.id || Math.floor(Math.random() * 1000);
      }),
      removeAll: vi.fn((callback?: () => void) => {
        createdMenus.length = 0;
        if (callback) callback();
      }),
      onClicked: {
        addListener: vi.fn((cb) => {
          contextMenuListeners.push(cb);
        }),
        removeListener: vi.fn((cb) => {
          const idx = contextMenuListeners.indexOf(cb);
          if (idx !== -1) contextMenuListeners.splice(idx, 1);
        }),
        dispatch: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
          for (const listener of contextMenuListeners) {
            listener(info, tab);
          }
        },
      },
      _createdMenus: createdMenus,
    },
    storage: {
      local: {
        get: vi.fn(async (keys?: string | string[] | Record<string, unknown> | null) => {
          if (!keys) return { ...storageLocal };
          if (typeof keys === 'string') return { [keys]: storageLocal[keys] };
          if (Array.isArray(keys)) {
            const res: Record<string, unknown> = {};
            for (const k of keys) res[k] = storageLocal[k];
            return res;
          }
          if (typeof keys === 'object') {
            const res: Record<string, unknown> = { ...keys };
            for (const k of Object.keys(keys)) {
              if (storageLocal[k] !== undefined) res[k] = storageLocal[k];
            }
            return res;
          }
          return {};
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(storageLocal, items);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          for (const k of arr) delete storageLocal[k];
        }),
        clear: vi.fn(async () => {
          for (const k of Object.keys(storageLocal)) delete storageLocal[k];
        }),
      },
      sync: {
        get: vi.fn(async (keys?: any) => {
          if (!keys) return { ...storageSync };
          if (typeof keys === 'string') return { [keys]: storageSync[keys] };
          return {};
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(storageSync, items);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          for (const k of arr) delete storageSync[k];
        }),
        clear: vi.fn(async () => {
          for (const k of Object.keys(storageSync)) delete storageSync[k];
        }),
      },
      _data: storageLocal,
    },
    action: {
      setBadgeText: vi.fn(async ({ text }: { text: string; tabId?: number }) => {
        currentBadgeText = text;
      }),
      setBadgeBackgroundColor: vi.fn(async ({ color }: { color: string; tabId?: number }) => {
        currentBadgeColor = color;
      }),
      setTitle: vi.fn(async ({ title }: { title: string; tabId?: number }) => {
        currentTitle = title;
      }),
      _getBadgeText: () => currentBadgeText,
      _getBadgeColor: () => currentBadgeColor,
      _getTitle: () => currentTitle,
    },
    tabs: {
      create: vi.fn(async (props: { url?: string; active?: boolean }) => ({
        id: Math.floor(Math.random() * 1000) + 1,
        url: props.url,
        active: props.active ?? true,
      })),
      query: vi.fn(async (_queryInfo: any) => [
        {
          id: 1,
          url: 'https://ejemplo.formosa.gob.ar',
          title: 'Portal Oficial Formosa',
          active: true,
        },
      ]),
      sendMessage: vi.fn(async (_tabId: number, _message: any) => ({ success: true })),
    },
    runtime: {
      lastError: null as { message: string } | null,
      getURL: vi.fn((path: string) => `chrome-extension://mock-extension-id/${path.replace(/^\//, '')}`),
      sendMessage: vi.fn(async (_message: any) => ({ success: true })),
      onInstalled: {
        addListener: vi.fn((cb) => {
          installedListeners.push(cb);
        }),
        dispatch: (details: chrome.runtime.InstalledDetails) => {
          for (const listener of installedListeners) listener(details);
        },
      },
      onMessage: {
        addListener: vi.fn((cb) => {
          messageListeners.push(cb);
        }),
        dispatch: (msg: any, sender: any = {}, sendResponse: (res?: any) => void = () => {}) => {
          for (const listener of messageListeners) listener(msg, sender, sendResponse);
        },
      },
    },
  };

  return mock;
}

export function setupChromeMock() {
  const mock = createChromeMock();
  (globalThis as unknown as { chrome: unknown }).chrome = mock;
  return mock;
}
