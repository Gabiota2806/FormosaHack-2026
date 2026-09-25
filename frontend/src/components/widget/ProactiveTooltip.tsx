import { X } from 'lucide-react';

export const TOOLTIP_TEXT = '¿Te llegó un mensaje raro? Consultalo acá';

interface ProactiveTooltipProps {
  onOpen: () => void;
  onDismiss: () => void;
}

/** Globo de invitación sobre el botón flotante, con flecha hacia el botón. */
export function ProactiveTooltip({ onOpen, onDismiss }: ProactiveTooltipProps) {
  return (
    <div role="status" className="relative max-w-[16rem] animate-fade-up">
      <div className="flex items-start gap-1 rounded-2xl bg-white py-2.5 pl-4 pr-1.5 text-sm font-semibold text-slate-800 shadow-xl shadow-black/30">
        <button
          type="button"
          onClick={onOpen}
          className="text-left leading-snug hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 rounded"
        >
          {TOOLTIP_TEXT}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar invitación"
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {/* Flecha apuntando al botón flotante */}
      <span
        className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white"
        aria-hidden="true"
      />
    </div>
  );
}
