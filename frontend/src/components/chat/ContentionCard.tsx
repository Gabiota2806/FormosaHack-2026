import { PhoneOff } from 'lucide-react';
import { CONTENTION } from './scripts';

/** Respuesta de "ruptura de pánico" para quien está siendo presionado en vivo. */
export function ContentionCard() {
  return (
    <div className="rounded-2xl rounded-bl-md border border-red-700 bg-red-950/50 p-4 sm:p-5 space-y-4" role="alert">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 animate-pulse">
          <PhoneOff className="w-6 h-6" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-red-300 leading-tight">{CONTENTION.title}</p>
          <p className="text-sm text-red-100/90 mt-1 leading-relaxed">{CONTENTION.body}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-red-900/60">
        <p className="text-[11px] font-bold text-red-300/80 uppercase tracking-wider mb-2">
          Si todavía insisten, preguntate:
        </p>
        <ul className="space-y-2">
          {CONTENTION.checks.map((c) => (
            <li key={c.question} className="p-2.5 rounded-lg bg-slate-950/60 border border-red-900/50 text-xs">
              <p className="text-slate-300">{c.question}</p>
              <p className="font-bold text-red-300 mt-1">→ {c.verdict}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
