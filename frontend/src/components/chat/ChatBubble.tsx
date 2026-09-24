import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'bot';
  /** Las tarjetas (análisis, contención) ocupan todo el ancho disponible. */
  wide?: boolean;
  children: ReactNode;
}

export function ChatBubble({ role, wide = false, children }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-600 text-white text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md shadow-blue-600/20">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5">
      <div
        className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20"
        aria-hidden="true"
      >
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div
        className={`${wide ? 'w-full' : 'max-w-[85%] sm:max-w-[70%]'} rounded-2xl rounded-bl-md bg-slate-800/80 border border-slate-700/60 text-slate-100 text-sm leading-relaxed`}
      >
        {children}
      </div>
    </div>
  );
}
