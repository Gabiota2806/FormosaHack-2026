import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'bot';
  /** Las tarjetas (análisis, contención) ocupan todo el ancho y traen su propio fondo. */
  wide?: boolean;
  children: ReactNode;
}

export function ChatBubble({ role, wide = false, children }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-bubble-in">
        <div className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-br from-sky-600 to-teal-600 text-white text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md shadow-sky-900/30">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5 animate-bubble-in">
      <div
        className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20"
        aria-hidden="true"
      >
        <ShieldCheck className="w-4 h-4" />
      </div>
      {wide ? (
        <div className="w-full min-w-0">{children}</div>
      ) : (
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-bl-md bg-white text-slate-800 text-sm leading-relaxed shadow-lg shadow-black/10">
          {children}
        </div>
      )}
    </div>
  );
}
