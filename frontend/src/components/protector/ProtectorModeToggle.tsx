import { ALargeSmall } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../ui/cn';
import { useProtectorMode } from './useProtectorMode';

export function ProtectorModeToggle() {
  const [enabled, setEnabled] = useProtectorMode();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    toast.success(
      next
        ? 'Modo Protector Mayor activado: letra más grande y más contraste.'
        : 'Modo Protector Mayor desactivado.',
    );
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={handleToggle}
      title="Modo Protector Mayor: letra grande y alto contraste"
      className={cn(
        'px-2.5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 border',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
        enabled
          ? 'bg-brand-400 text-slate-950 border-brand-400'
          : 'text-slate-300 hover:text-white border-slate-600 hover:border-slate-400',
      )}
    >
      <ALargeSmall className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">Modo Protector Mayor</span>
    </button>
  );
}
