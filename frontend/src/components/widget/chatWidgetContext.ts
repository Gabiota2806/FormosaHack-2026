import { createContext, useContext } from 'react';
import type { ChatAnalysisResponse } from '../../types';
import type { EntryMode } from '../chat/types';

/**
 * Pedido para el chat que ya está abierto: arrancar un momento de entrada o analizar
 * un mensaje. El id distingue pedidos iguales hechos en momentos distintos.
 */
export interface ChatRequest {
  id: number;
  entry?: EntryMode;
  message?: string;
  /** Volver a mostrar una consulta del historial (FH26-89). */
  restore?: RestoredConsultation;
  /** Cambiar a una vista específica dentro del widget (FH26-88). */
  view?: 'chat' | 'history';
}

export interface RestoredConsultation {
  analysis: ChatAnalysisResponse;
  sourceText: string;
}

export interface OpenChatOptions {
  /** Arranca el chat en ese momento ("antes", "durante" o "SOS"). */
  entry?: EntryMode;
  /** Analiza este mensaje apenas se abre (p. ej. compartido desde WhatsApp). */
  message?: string;
  /** Muestra una consulta del historial, lista para seguir preguntando sobre ella. */
  restore?: RestoredConsultation;
  /** Abre directamente en la vista indicada ('chat' o 'history') (FH26-88). */
  view?: 'chat' | 'history';
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
