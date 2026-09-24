import { PhoneOff } from 'lucide-react';
import { CONTENTION } from './scripts';

/** Respuesta de "ruptura de pánico" para quien está siendo presionado en vivo. */
export function ContentionCard() {
  return (
    <div
      className="rounded-2xl rounded-bl-md overflow-hidden bg-white text-slate-800 shadow-xl shadow-red-950/30"
      role="alert"
    >
      <div className="bg-red-600 px-4 sm:px-5 py-4 flex items-start gap-3 text-white">
        <div className="w-11 h-11 shrink-0 rounded-full bg-white/15 flex items-center justify-center animate-pulse">
          <PhoneOff className="w-6 h-6" />
        </div>
        <div>
          <p className="text-lg font-extrabold leading-tight">{CONTENTION.title}</p>
          <p className="text-sm text-red-50 mt-1 leading-relaxed">{CONTENTION.body}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Si todavía insisten, preguntate:
        </p>
        <ul className="space-y-2">
          {CONTENTION.checks.map((c) => (
            <li key={c.question} className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm">
              <p className="text-slate-700">{c.question}</p>
              <p className="font-bold text-red-700 mt-1">{c.verdict}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
