import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../ui/cn';

export const CHAT_PANEL_ID = 'chat-widget-panel';

/** En pantallas chicas el panel es una hoja inferior y no se abre el teclado solo. */
const DESKTOP_QUERY = '(min-width: 640px)';

interface ChatWidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Panel del asistente (FH26-69): ventana flotante sobre el botón en la PC y hoja inferior
 * en el celular. Queda montado aunque esté cerrado (inert): así puede animar el cierre y
 * la conversación no se pierde al minimizar.
 */
export function ChatWidgetPanel({ isOpen, onClose, children }: ChatWidgetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // En la PC, al abrir, el cursor va a la caja de texto (en el celular abriría el teclado).
  useEffect(() => {
    if (!isOpen || !window.matchMedia?.(DESKTOP_QUERY).matches) return;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector('textarea')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Escape minimiza, salvo que haya un diálogo modal encima (el SOS maneja su propio Escape).
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Fondo del celular: tocarlo cierra la hoja */}
      <div
        data-testid="chat-widget-backdrop"
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 sm:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        ref={panelRef}
        id={CHAT_PANEL_ID}
        role="dialog"
        aria-label="Asistente CiberGuardián"
        inert={!isOpen}
        className={cn(
          'fixed z-40 flex flex-col overflow-hidden bg-slate-800 shadow-2xl shadow-black/50',
          'transition-[opacity,transform] duration-300 ease-out',
          // Celular: hoja que sube desde abajo
          'inset-x-0 bottom-0 h-[88dvh] rounded-t-3xl border-t border-slate-700',
          // PC: ventana flotante sobre el botón, creciendo desde su esquina
          'sm:inset-x-auto sm:right-6 sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:w-[420px]',
          'sm:h-[min(600px,calc(100dvh-8rem))] sm:rounded-3xl sm:border sm:origin-bottom-right',
          isOpen
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'pointer-events-none translate-y-full opacity-0 sm:translate-y-4 sm:scale-95',
        )}
      >
        {/* Agarre visual de la hoja en el celular */}
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-slate-600 sm:hidden" aria-hidden="true" />
        <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)] sm:pb-0">{children}</div>
      </div>
    </>
  );
}
