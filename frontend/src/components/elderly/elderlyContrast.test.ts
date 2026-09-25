/// <reference types="node" />
// Test de Node: lee archivos del proyecto (el tsconfig de la app no incluye los tipos de Node).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Contraste WCAG AAA del Modo Abuelo (7:1 en texto normal), calculado con los colores reales:
// los overrides de .modo-abuelo en index.css, el tema de la app (@theme) y la paleta de Tailwind.
// Si alguien cambia un color y baja el contraste, falla acá.

const AAA = 7;

// Vitest corre desde la raíz del frontend.
const appCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const tailwindCss = readFileSync(resolve(process.cwd(), 'node_modules/tailwindcss/theme.css'), 'utf8');

function readVars(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** Variables del primer bloque cuyo selector es exactamente `selector`. */
function readBlock(selector: string): Record<string, string> {
  const start = appCss.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No está el bloque ${selector} en index.css`);
  return readVars(appCss.slice(start, appCss.indexOf('}', start)));
}

const themeStart = appCss.indexOf('@theme {');
const theme = { ...readVars(tailwindCss), ...readVars(appCss.slice(themeStart, appCss.indexOf('@keyframes', themeStart))) };
const elderly = { ...theme, ...readBlock(':root.modo-abuelo') };
const elderlyOnLight = { ...elderly, ...readBlock(':root.modo-abuelo :is(.bg-white, .bg-slate-50, .bg-slate-100)') };

/** Color CSS (#rrggbb, #rgb u oklch()) a sRGB lineal, que es lo que usa la fórmula de luminancia. */
function toLinearRgb(color: string): [number, number, number] {
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
  }

  const oklch = color.match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)$/);
  if (!oklch) throw new Error(`Formato de color no soportado: ${color}`);
  const [l, c, h] = [Number(oklch[1]) / 100, Number(oklch[2]), (Number(oklch[3]) * Math.PI) / 180];
  const [a, b] = [c * Math.cos(h), c * Math.sin(h)];
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2]),
    clamp(-1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2]),
    clamp(-0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2]),
  ];
}

function luminance(color: string): number {
  const [r, g, b] = toLinearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function pairs(vars: Record<string, string>, fgs: string[], bgs: string[]) {
  return fgs.flatMap((fg) => bgs.map((bg) => [fg, bg, vars[fg], vars[bg]] as const));
}

describe('Modo Abuelo: contraste WCAG AAA', () => {
  it('lee los colores de index.css y de Tailwind', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
    expect(elderly['slate-400']).toBeDefined();
    expect(elderlyOnLight['slate-400']).not.toBe(elderly['slate-400']);
  });

  it.each(pairs(elderly, ['slate-300', 'slate-400', 'slate-500'], ['slate-900', 'slate-800']))(
    'texto %s sobre el fondo oscuro %s',
    (_fg, _bg, fg, bg) => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AAA);
    },
  );

  it.each(
    pairs(elderlyOnLight, ['slate-400', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900'], [
      'white',
      'slate-50',
      'slate-100',
    ]),
  )('texto %s sobre la superficie clara %s', (_fg, _bg, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AAA);
  });

  it.each(['red-600', 'red-500'])('texto blanco sobre el rojo de emergencia %s (también en hover)', (red) => {
    expect(contrast('#ffffff', elderly[red])).toBeGreaterThanOrEqual(AAA);
  });

  // Combinaciones propias de las pantallas del Modo Abuelo.
  it.each([
    ['veredicto sospechoso', 'slate-950', 'amber-300'],
    ['veredicto seguro', 'slate-950', 'brand-500'],
    ['botón de revisar mensaje', 'slate-950', 'brand-500'],
    ['botón Banco Formosa (antipánico)', 'red-800', 'white'],
    ['botón Policía (antipánico)', 'white', 'slate-950'],
    ['botón llamar al banco (veredicto)', 'white', 'slate-900'],
  ])('%s: %s sobre %s', (_name, fg, bg) => {
    expect(contrast(elderly[fg], elderly[bg])).toBeGreaterThanOrEqual(AAA);
  });
});
