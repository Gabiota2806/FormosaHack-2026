import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChatWidgetContext, type ChatRequest, type OpenChatOptions } from './chatWidgetContext';

/** Estado global del asistente (FH26-70): vive por encima de las secciones de la app. */
interface ChatWidgetProviderProps {
  children: ReactNode;
  /**
   * Mensaje a analizar apenas arranca la app (compartido desde WhatsApp): el panel empieza
   * abierto con el pedido ya cargado. En el estado inicial y no en un efecto, para que el
   * doble montaje de StrictMode no lo pida dos veces.
   */
  initialMessage?: string;
}

export function ChatWidgetProvider({ children, initialMessage }: ChatWidgetProviderProps) {
  const [isOpen, setIsOpen] = useState(() => Boolean(initialMessage));
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [request, setRequest] = useState<ChatRequest | null>(() =>
    initialMessage ? { id: 1, message: initialMessage } : null,
  );
  const nextRequestId = useRef(2);

  const openChat = useCallback((options: OpenChatOptions = {}) => {
    setIsOpen(true);
    if (options.entry || options.message) {
      setRequest({ id: nextRequestId.current++, entry: options.entry, message: options.message });
    }
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  const onRequestHandled = useCallback((id: number) => {
    setRequest((current) => (current?.id === id ? null : current));
  }, []);

  const value = useMemo(
    () => ({ isOpen, openChat, closeChat, hasActiveSession, setHasActiveSession, request, onRequestHandled }),
    [isOpen, openChat, closeChat, hasActiveSession, request, onRequestHandled],
  );

  return <ChatWidgetContext.Provider value={value}>{children}</ChatWidgetContext.Provider>;
}
