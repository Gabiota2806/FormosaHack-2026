import { MessageCircle, X } from 'lucide-react';
import { cn } from '../ui/cn';
import { ProactiveTooltip } from './ProactiveTooltip';
import { useProactiveTooltip } from './useProactiveTooltip';

interface ChatLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Hay una conversación en curso (diagnóstico o borrador): muestra un indicador. */
  hasActiveSession?: boolean;
  /** id del panel del chat que abre este botón (para aria-controls). */
  panelId?: string;
  /** Demora del globo de invitación; se expone para los tests. */
  tooltipDelayMs?: number;
}

/**
 * Botón flotante del asistente (FH26-68): siempre visible abajo a la derecha,
 * por encima del contenido (z-40) y por debajo del SOS (z-50).
 */
export function ChatLauncher({
  isOpen,
  onToggle,
  hasActiveSession = false,
  panelId = 'chat-widget-panel',
  tooltipDelayMs,
}: ChatLauncherProps) {
  const tooltip = useProactiveTooltip(isOpen, tooltipDelayMs);

  // Abrir el chat cuenta como "ya lo vio": no hace falta volver a invitar.
  const handleToggle = () => {
    if (!isOpen) tooltip.dismiss();
    onToggle();
  };

  const label = isOpen
    ? 'Cerrar asistente CiberGuardián'
    : hasActiveSession
      ? 'Abrir asistente CiberGuardián (tenés una consulta en curso)'
      : 'Abrir asistente CiberGuardián';

  return (
    <div
      className={cn(
        'fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col items-end gap-3',
        // En el celular, con el panel abierto, la hoja tiene su propio control y el botón taparía el envío.
        isOpen && 'max-sm:hidden',
      )}
    >
      {tooltip.visible && <ProactiveTooltip onOpen={handleToggle} onDismiss={tooltip.dismiss} />}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full text-white',
          'bg-gradient-to-br from-sky-500 to-brand-500 shadow-xl shadow-brand-500/30',
          'transition-transform hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        )}
      >
        {/* Halo de pulso suave, solo con el chat cerrado */}
        {!isOpen && (
          <span
            className="absolute inset-0 -z-10 scale-110 rounded-full bg-brand-400/40 motion-safe:animate-pulse"
            aria-hidden="true"
          />
        )}

        <MessageCircle
          className={cn(
            'absolute h-6 w-6 transition-all duration-200',
            isOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
          aria-hidden="true"
        />
        <X
          className={cn(
            'absolute h-6 w-6 transition-all duration-200',
            isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
          )}
          aria-hidden="true"
        />

        {hasActiveSession && !isOpen && (
          <span
            data-testid="launcher-session-badge"
            className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-slate-900"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
