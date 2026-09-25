import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatHistoryEntry } from '../../types';
import { ChatAssistant } from '../chat/ChatAssistant';
import { getAnonymousSessionKey, useHistoryOptOut } from '../chat/historyPreference';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { ChatHistoryView } from './ChatHistoryView';
import { ChatLauncher } from './ChatLauncher';
import { CHAT_PANEL_ID, ChatWidgetPanel } from './ChatWidgetPanel';
import { useChatWidget } from './chatWidgetContext';
import { toRestoredConsultation } from './historyUtils';
import { useAutoClaim } from './useAutoClaim';

interface ChatWidgetProps {
  onOpenSos?: () => void;
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
}

/**
 * Asistente en formato widget: botón flotante + panel desplegable (FH26-68 / FH26-69).
 * El estado vive en ChatWidgetProvider (FH26-70), así cualquier parte de la app puede abrirlo.
 * Con sesión iniciada suma "Mis consultas" y vincula las consultas anónimas (FH26-89).
 */
export function ChatWidget({ onOpenSos, onReportIncident }: ChatWidgetProps) {
  const { isOpen, openChat, closeChat, hasActiveSession, setHasActiveSession, request, onRequestHandled } =
    useChatWidget();
  const { isAuthenticated } = useAuth();
  const [optedOut, setOptedOut] = useHistoryOptOut();
  const [view, setView] = useState<'chat' | 'history'>('chat');
  useAutoClaim();

  // Si llega un pedido con vista específica (ej: 'history' desde UserDropdown), conmutar vista
  useEffect(() => {
    if (request?.view) {
      setView(request.view);
      onRequestHandled(request.id);
    }
  }, [request, onRequestHandled]);

  // Si se cierra la sesión con el historial abierto, se vuelve al chat.
  const showHistory = view === 'history' && isAuthenticated;

  const close = useCallback(() => {
    closeChat();
    // El foco vuelve al botón que abre el panel, para no perderlo al minimizar.
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[aria-controls="${CHAT_PANEL_ID}"]`)?.focus(),
    );
  }, [closeChat]);

  const handleRestore = (entry: ChatHistoryEntry) => {
    setView('chat');
    openChat({ restore: toRestoredConsultation(entry) });
  };

  const toggleSaving = () => {
    const next = !optedOut;
    setOptedOut(next);
    toast.info(
      next
        ? 'Listo: no vamos a guardar tus próximas consultas.'
        : 'Vamos a guardar tus consultas de forma anónima para que puedas recuperarlas con una cuenta.',
    );
  };

  // Qué se guarda, dicho en claro (privacidad): con cuenta se guarda siempre en el historial.
  const headerNote = isAuthenticated ? (
    <>
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
      Tus consultas se guardan en tu historial
    </>
  ) : (
    <>
      <span className={cn('h-1.5 w-1.5 rounded-full', optedOut ? 'bg-slate-500' : 'bg-brand-400')} aria-hidden="true" />
      {optedOut ? 'No guardamos tus consultas' : 'Guardamos tus consultas de forma anónima'}
      <span aria-hidden="true">·</span>
      <button
        type="button"
        role="switch"
        aria-checked={!optedOut}
        aria-label="Guardar mis consultas de forma anónima"
        onClick={toggleSaving}
        className="rounded font-semibold text-brand-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-400"
      >
        {optedOut ? 'Guardar' : 'No guardar'}
      </button>
    </>
  );

  const minimizeButton = (
    <Button
      variant="ghost"
      size="sm"
      icon={ChevronDown}
      onClick={close}
      aria-label="Minimizar asistente"
      title="Minimizar"
      className="h-9 w-9 px-0"
    />
  );

  return (
    <>
      <ChatWidgetPanel isOpen={isOpen} onClose={close}>
        {/* El chat queda montado (oculto) mientras se ve el historial: no se pierde la conversación. */}
        <div className={cn('h-full', showHistory && 'hidden')}>
          <ChatAssistant
            onOpenSos={onOpenSos}
            onReportIncident={onReportIncident}
            request={request}
            onRequestHandled={onRequestHandled}
            onActivityChange={setHasActiveSession}
            anonymousSessionKey={!isAuthenticated && !optedOut ? getAnonymousSessionKey() : undefined}
            headerNote={headerNote}
            onOpenHistory={isAuthenticated ? () => setView('history') : undefined}
            headerActions={minimizeButton}
          />
        </div>
        {showHistory && (
          <ChatHistoryView onBack={() => setView('chat')} onRestore={handleRestore} headerActions={minimizeButton} />
        )}
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
