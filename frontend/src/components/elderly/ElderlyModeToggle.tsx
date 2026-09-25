import { Accessibility } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../ui/cn';
import { useElderlyMode } from './elderlyMode';

export function ElderlyModeToggle() {
  const { enabled, setEnabled } = useElderlyMode();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    toast.success(
      next
        ? 'Modo Abuelo activado: letra más grande y más contraste.'
        : 'Modo Abuelo desactivado.',
    );
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={handleToggle}
      title="Modo Abuelo / Simple: letra grande y alto contraste"
      className={cn(
        'px-2.5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 border',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
        enabled
          ? 'bg-brand-400 text-slate-950 border-brand-400'
          : 'text-slate-300 hover:text-white border-slate-600 hover:border-slate-400',
      )}
    >
      <Accessibility className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">Modo Abuelo / Simple</span>
    </button>
  );
}
