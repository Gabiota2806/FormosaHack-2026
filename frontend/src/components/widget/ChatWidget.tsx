import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChatAssistant } from '../chat/ChatAssistant';
import { Button } from '../ui/Button';
import { ChatLauncher } from './ChatLauncher';
import { CHAT_PANEL_ID, ChatWidgetPanel } from './ChatWidgetPanel';

interface ChatWidgetProps {
  onOpenSos?: () => void;
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
}

/** Asistente en formato widget: botón flotante + panel desplegable (FH26-68 / FH26-69). */
export function ChatWidget({ onOpenSos, onReportIncident }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
    // El foco vuelve al botón que abre el panel, para no perderlo al minimizar.
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[aria-controls="${CHAT_PANEL_ID}"]`)?.focus(),
    );
  }, []);

  return (
    <>
      <ChatWidgetPanel isOpen={isOpen} onClose={close}>
        <ChatAssistant
          variant="embedded"
          onOpenSos={onOpenSos}
          onReportIncident={onReportIncident}
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
        onToggle={() => (isOpen ? close() : setIsOpen(true))}
        panelId={CHAT_PANEL_ID}
      />
    </>
  );
}
