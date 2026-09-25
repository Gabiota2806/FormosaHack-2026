import { AnalysisStorageItem } from '../types/extension.js';
import { validateAnalysisInput } from '../utils/validation.js';

export const MENU_ITEM_ID = 'ciberguardian-analyze';
export const STORAGE_KEY_LATEST = 'ciberguardian_latest_analysis';

export function initializeContextMenu(): void {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ITEM_ID,
      title: 'Analizar con CiberGuardián',
      contexts: ['selection', 'link'],
    });
  });
}

export function extractPayloadFromClick(info: chrome.contextMenus.OnClickData): string {
  if (info.selectionText && info.selectionText.trim().length > 0) {
    return info.selectionText;
  }
  if (info.linkUrl && info.linkUrl.trim().length > 0) {
    return info.linkUrl;
  }
  return '';
}

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<AnalysisStorageItem> {
  if (info.menuItemId !== MENU_ITEM_ID) {
    throw new Error(`Item de menú desconocido: ${info.menuItemId}`);
  }

  const payload = extractPayloadFromClick(info);
  const validation = validateAnalysisInput(payload);

  const timestamp = Date.now();
  const itemId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `cbg-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;

  if (!validation.isValid) {
    const errorItem: AnalysisStorageItem = {
      id: itemId,
      text: validation.sanitizedText || '',
      sourceUrl: tab?.url || info.pageUrl,
      sourceTitle: tab?.title,
      timestamp,
      status: 'error',
      errorMessage: validation.error,
      charCount: validation.charCount,
    };

    if (typeof chrome !== 'undefined' && chrome.action) {
      await chrome.action.setBadgeText({ text: '!' });
      await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    }

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY_LATEST]: errorItem });
    }

    return errorItem;
  }

  const pendingItem: AnalysisStorageItem = {
    id: itemId,
    text: validation.sanitizedText!,
    sourceUrl: tab?.url || info.pageUrl,
    sourceTitle: tab?.title,
    timestamp,
    status: 'pending',
    charCount: validation.charCount,
  };

  if (typeof chrome !== 'undefined' && chrome.action) {
    await chrome.action.setBadgeText({ text: '...' });
    await chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_LATEST]: pendingItem });
  }

  return pendingItem;
}

// Registro de eventos en entorno de extensión de navegador
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    initializeContextMenu();
  });
}

if (typeof chrome !== 'undefined' && chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    handleContextMenuClick(info, tab).catch((err) => {
      console.error('[CiberGuardián SW] Error procesando clic de menú contextual:', err);
    });
  });
}
