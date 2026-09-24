import { useMemo, useState } from 'react';
import { Info, MousePointerClick } from 'lucide-react';
import type { HighlightedPhrase } from '../../types';
import { cn } from '../ui/cn';
import { buildHighlightSegments } from './highlight';
import { getCategoryStyle } from './phraseCategories';

interface HighlightedMessageProps {
  text: string;
  phrases: HighlightedPhrase[];
}

/** Mensaje original con las trampas marcadas; al tocar una se explica por qué es peligrosa. */
export function HighlightedMessage({ text, phrases }: HighlightedMessageProps) {
  const { segments, unmatched } = useMemo(() => buildHighlightSegments(text, phrases), [text, phrases]);
  const [selected, setSelected] = useState<number | null>(null);

  const matchedIndexes = [
    ...new Set(segments.flatMap((s) => (s.phraseIndex === undefined ? [] : [s.phraseIndex]))),
  ];
  const categories = [...new Set(matchedIndexes.map((i) => phrases[i].category))];
  const selectedPhrase = selected === null ? null : phrases[selected];

  const toggle = (index: number) => setSelected((current) => (current === index ? null : index));

  return (
    <div className="space-y-3">
      <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-7 text-slate-800 whitespace-pre-wrap break-words">
        {segments.map((s) => {
          if (s.phraseIndex === undefined) return <span key={s.start}>{s.text}</span>;

          const index = s.phraseIndex;
          const style = getCategoryStyle(phrases[index].category);
          return (
            <mark
              key={s.start}
              role="button"
              tabIndex={0}
              aria-pressed={selected === index}
              aria-label={`${s.text}: ${style.label}`}
              onClick={() => toggle(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(index);
                }
              }}
              className={cn(
                'rounded px-0.5 font-semibold cursor-pointer box-decoration-clone transition-shadow break-all',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-700',
                style.mark,
                selected === index && 'ring-2 ring-slate-700/70',
              )}
            >
              {s.text}
            </mark>
          );
        })}
      </p>

      {matchedIndexes.length > 0 && (
        <div aria-live="polite" className="min-h-10">
          {selectedPhrase ? (
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-xs animate-bubble-in">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span
                  className={cn('w-2 h-2 rounded-full shrink-0', getCategoryStyle(selectedPhrase.category).dot)}
                  aria-hidden="true"
                />
                {getCategoryStyle(selectedPhrase.category).label}
              </p>
              <p className="text-slate-600 mt-1 leading-relaxed">{selectedPhrase.reason}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 py-2">
              <MousePointerClick className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Tocá una parte marcada para ver por qué es una trampa.
            </p>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Tipos de trampa encontrados">
          {categories.map((c) => {
            const style = getCategoryStyle(c);
            return (
              <li key={c} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', style.dot)} aria-hidden="true" />
                {style.label}
              </li>
            );
          })}
        </ul>
      )}

      {unmatched.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            También detectamos
          </p>
          <ul className="space-y-1.5">
            {unmatched.map((i) => (
              <li key={i} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{getCategoryStyle(phrases[i].category).label}:</span>{' '}
                {phrases[i].reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
