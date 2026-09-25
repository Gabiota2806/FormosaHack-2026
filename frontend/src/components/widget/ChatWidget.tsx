import { useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChatAssistant } from '../chat/ChatAssistant';
import { Button } from '../ui/Button';
import { ChatLauncher } from './ChatLauncher';
import { CHAT_PANEL_ID, ChatWidgetPanel } from './ChatWidgetPanel';
import { useChatWidget } from './chatWidgetContext';

interface ChatWidgetProps {
  onOpenSos?: () => void;
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
}

/**
 * Asistente en formato widget: botón flotante + panel desplegable (FH26-68 / FH26-69).
 * El estado vive en ChatWidgetProvider (FH26-70), así cualquier parte de la app puede abrirlo.
 */
export function ChatWidget({ onOpenSos, onReportIncident }: ChatWidgetProps) {
  const { isOpen, openChat, closeChat, hasActiveSession, setHasActiveSession, request, onRequestHandled } =
    useChatWidget();

  const close = useCallback(() => {
    closeChat();
    // El foco vuelve al botón que abre el panel, para no perderlo al minimizar.
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[aria-controls="${CHAT_PANEL_ID}"]`)?.focus(),
    );
  }, [closeChat]);

  return (
    <>
      <ChatWidgetPanel isOpen={isOpen} onClose={close}>
        <ChatAssistant
          onOpenSos={onOpenSos}
          onReportIncident={onReportIncident}
          request={request}
          onRequestHandled={onRequestHandled}
          onActivityChange={setHasActiveSession}
          headerActions={
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronDown}
              onClick={close}
              aria-label="Minimizar asistente"
              title="Minimizar"
              className="h-9 w-9 px-0"
            />
          }
        />
      </ChatWidgetPanel>

      <ChatLauncher
        isOpen={isOpen}
        onToggle={() => (isOpen ? close() : openChat())}
        hasActiveSession={hasActiveSession}
        panelId={CHAT_PANEL_ID}
      />
    </>
  );
}
