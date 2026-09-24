import { describe, expect, it } from 'vitest';
import type { HighlightedPhrase } from '../../types';
import { buildHighlightSegments } from './highlight';

const phrase = (text: string, category: HighlightedPhrase['category'] = 'URGENCE'): HighlightedPhrase => ({
  phrase: text,
  reason: `motivo de ${text}`,
  category,
});

/** Representa los tramos como texto, con las frases resaltadas entre corchetes. */
const render = (text: string, phrases: HighlightedPhrase[]) =>
  buildHighlightSegments(text, phrases)
    .segments.map((s) => (s.phraseIndex === undefined ? s.text : `[${s.text}]`))
    .join('');

describe('buildHighlightSegments', () => {
  it('sin frases devuelve el mensaje entero sin resaltar', () => {
    expect(buildHighlightSegments('Hola', [])).toEqual({
      segments: [{ text: 'Hola', start: 0 }],
      unmatched: [],
    });
  });

  it('encuentra la frase sin distinguir mayúsculas y conserva el texto original', () => {
    expect(render('¡URGENTE! Tu cuenta', [phrase('urgente')])).toBe('¡[URGENTE]! Tu cuenta');
  });

  it('marca todas las apariciones de una frase', () => {
    expect(render('token y otro Token', [phrase('token', 'CREDENTIALS')])).toBe('[token] y otro [Token]');
  });

  it('ignora frases repetidas que manda el backend', () => {
    const { segments } = buildHighlightSegments('clave clave', [phrase('clave'), phrase('clave')]);
    expect(segments.filter((s) => s.phraseIndex !== undefined).map((s) => s.phraseIndex)).toEqual([0, 0]);
  });

  it('si dos frases se pisan gana la más larga que empieza en el mismo lugar', () => {
    expect(render('Banco Formosa te llama', [phrase('banco'), phrase('banco formosa', 'AUTHORITY')])).toBe(
      '[Banco Formosa] te llama',
    );
  });

  it('si dos frases se pisan gana la que empieza antes', () => {
    expect(render('código de 6 dígitos', [phrase('6 dígitos'), phrase('código de 6')])).toBe(
      '[código de 6] dígitos',
    );
  });

  it('busca enlaces con caracteres especiales de forma literal', () => {
    expect(render('Entrá a bit.ly/bono-(1)?x=2 ya', [phrase('bit.ly/bono-(1)?x=2', 'FAKE_LINK')])).toBe(
      'Entrá a [bit.ly/bono-(1)?x=2] ya',
    );
  });

  it('informa las frases que no aparecen en el mensaje', () => {
    const { segments, unmatched } = buildHighlightSegments('Hola', [phrase('hola'), phrase('chigüe', 'AUTHORITY')]);
    expect(segments.map((s) => s.text)).toEqual(['Hola']);
    expect(unmatched).toEqual([1]);
  });
});
