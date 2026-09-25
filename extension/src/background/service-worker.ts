import { AnalysisStorageItem } from '../types/extension.js';
import { validateAnalysisInput } from '../utils/validation.js';
import {
  CoreApiClient,
  apiClient,
  updateBadgeForRisk,
  saveAnalysisToStorage,
  DEFAULT_STORAGE_KEY,
} from '../services/api-client.js';

export const MENU_ITEM_ID = 'ciberguardian-analyze';
export const STORAGE_KEY_LATEST = DEFAULT_STORAGE_KEY;

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

export async function executeAnalysisPipeline(
  item: AnalysisStorageItem,
  client: CoreApiClient = apiClient
): Promise<AnalysisStorageItem> {
  try {
    const analysis = await client.analyzeMessage(item.text);
    if (analysis.success && analysis.data) {
      item.status = 'analyzed';
      item.result = analysis.data;
      item.isOffline = analysis.isOfflineFallback ?? false;
      await updateBadgeForRisk(analysis.data.risk_level);
    } else {
      item.status = 'error';
      item.errorMessage = analysis.error || 'Error al analizar el contenido';
      await updateBadgeForRisk('error');
    }
  } catch (err: unknown) {
    item.status = 'error';
    item.errorMessage = err instanceof Error ? err.message : 'Error inesperado';
    await updateBadgeForRisk('error');
  }

  await saveAnalysisToStorage(item, STORAGE_KEY_LATEST);
  return item;
}

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
  options?: { autoAnalyze?: boolean; client?: CoreApiClient }
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

    await updateBadgeForRisk('error');
    await saveAnalysisToStorage(errorItem, STORAGE_KEY_LATEST);

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

  await updateBadgeForRisk('pending');
  await saveAnalysisToStorage(pendingItem, STORAGE_KEY_LATEST);

  if (options?.autoAnalyze) {
    return await executeAnalysisPipeline(pendingItem, options?.client);
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
    handleContextMenuClick(info, tab, { autoAnalyze: true }).catch((err) => {
      console.error('[CiberGuardián SW] Error procesando clic de menú contextual:', err);
    });
  });
}
