import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChatWidgetContext, type ChatRequest, type OpenChatOptions } from './chatWidgetContext';

/** Estado global del asistente (FH26-70): vive por encima de las secciones de la app. */
export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [request, setRequest] = useState<ChatRequest | null>(null);
  const nextRequestId = useRef(1);

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
