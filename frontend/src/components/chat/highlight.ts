import type { HighlightedPhrase } from '../../types';

export interface HighlightSegment {
  text: string;
  /** Posición del tramo en el mensaje original (sirve como key estable). */
  start: number;
  /** Índice en `phrases` si el tramo es una frase resaltada. */
  phraseIndex?: number;
}

export interface HighlightResult {
  segments: HighlightSegment[];
  /** Índices de frases que el backend detectó pero no aparecen literalmente en el mensaje. */
  unmatched: number[];
}

interface Range {
  start: number;
  end: number;
  phraseIndex: number;
}

/**
 * Parte el mensaje en tramos normales y resaltados.
 *
 * El backend devuelve las frases en minúsculas (analiza el texto con `.lower()`),
 * así que la búsqueda no distingue mayúsculas. Se marcan todas las apariciones y,
 * si dos frases se pisan, gana la que empieza antes (y ante empate, la más larga).
 */
export function buildHighlightSegments(text: string, phrases: HighlightedPhrase[]): HighlightResult {
  const haystack = text.toLowerCase();
  const ranges: Range[] = [];
  const unmatched: number[] = [];
  const seen = new Set<string>();

  phrases.forEach((p, phraseIndex) => {
    const needle = p.phrase.trim().toLowerCase();
    if (!needle) {
      unmatched.push(phraseIndex);
      return;
    }
    // El backend repite la misma frase por cada aparición: basta con buscarla una vez.
    if (seen.has(needle)) return;
    seen.add(needle);

    let from = haystack.indexOf(needle);
    if (from === -1) {
      unmatched.push(phraseIndex);
      return;
    }
    while (from !== -1) {
      ranges.push({ start: from, end: from + needle.length, phraseIndex });
      from = haystack.indexOf(needle, from + needle.length);
    }
  });

  ranges.sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue; // se pisa con una frase ya marcada
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), start: cursor });
    segments.push({ text: text.slice(r.start, r.end), start: r.start, phraseIndex: r.phraseIndex });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), start: cursor });

  return { segments, unmatched };
}
