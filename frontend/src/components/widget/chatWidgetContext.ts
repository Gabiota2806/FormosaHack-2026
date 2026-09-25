import { createContext, useContext } from 'react';
import type { EntryMode } from '../chat/types';

/**
 * Pedido para el chat que ya está abierto: arrancar un momento de entrada o analizar
 * un mensaje. El id distingue pedidos iguales hechos en momentos distintos.
 */
export interface ChatRequest {
  id: number;
  entry?: EntryMode;
  message?: string;
}

export interface OpenChatOptions {
  /** Arranca el chat en ese momento ("antes", "durante" o "SOS"). */
  entry?: EntryMode;
  /** Analiza este mensaje apenas se abre (p. ej. compartido desde WhatsApp). */
  message?: string;
}

export interface ChatWidgetContextValue {
  isOpen: boolean;
  /** Abre el panel desde cualquier lugar de la app, opcionalmente con un pedido. */
  openChat: (options?: OpenChatOptions) => void;
  closeChat: () => void;
  /** Hay conversación o un borrador en el chat: el botón flotante lo indica. */
  hasActiveSession: boolean;
  setHasActiveSession: (active: boolean) => void;
  /** Pedido pendiente para el chat; se descarta con onRequestHandled. */
  request: ChatRequest | null;
  onRequestHandled: (id: number) => void;
}

export const ChatWidgetContext = createContext<ChatWidgetContextValue | null>(null);

export function useChatWidget(): ChatWidgetContextValue {
  const value = useContext(ChatWidgetContext);
  if (!value) throw new Error('useChatWidget debe usarse dentro de <ChatWidgetProvider>.');
  return value;
}
