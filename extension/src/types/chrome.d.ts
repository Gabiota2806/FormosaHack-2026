declare namespace chrome.runtime {
  interface InstalledDetails {
    reason: string;
    previousVersion?: string;
  }
  const onInstalled: {
    addListener(callback: (details: InstalledDetails) => void): void;
  };
}

declare namespace chrome.tabs {
  interface Tab {
    id?: number;
    url?: string;
    title?: string;
    active?: boolean;
  }
}

declare namespace chrome.contextMenus {
  interface CreateProperties {
    id?: string;
    title?: string;
    contexts?: Array<'all' | 'page' | 'selection' | 'link' | 'image' | 'action'>;
    onclick?: (info: OnClickData, tab?: chrome.tabs.Tab) => void;
  }

  interface OnClickData {
    menuItemId: string | number;
    parentMenuItemId?: string | number;
    selectionText?: string;
    linkUrl?: string;
    pageUrl?: string;
    frameUrl?: string;
  }

  function removeAll(callback?: () => void): void;
  function create(createProperties: CreateProperties, callback?: () => void): string | number;

  const onClicked: {
    addListener(callback: (info: OnClickData, tab?: chrome.tabs.Tab) => void): void;
  };
}

declare namespace chrome.action {
  function setBadgeText(details: { text: string; tabId?: number }): Promise<void>;
  function setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void>;
}

declare namespace chrome.storage {
  interface StorageArea {
    get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
  }

  const local: StorageArea;
  const sync: StorageArea;
}
