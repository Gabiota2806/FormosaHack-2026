/// <reference types="node" />
// Test de Node: lee archivos del proyecto (el tsconfig de la app no incluye los tipos de Node).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ELDERLY_CLASS, ELDERLY_STORAGE_KEY, LEGACY_PROTECTOR_KEY } from './elderlyMode';

// Script en línea de index.html que aplica el Modo Abuelo antes del primer render (sin parpadeo).
// Se prueba el que de verdad se publica, no una copia: si cambian la clave o la clase, falla acá.
// Vitest corre desde la raíz del frontend.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const prerender = inlineScripts.find((code) => code.includes(ELDERLY_STORAGE_KEY));

function runPrerender() {
  new Function(prerender!)();
}

describe('index.html: Modo Abuelo antes del primer render', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(ELDERLY_CLASS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('existe y usa las mismas claves y clase que elderlyMode.ts', () => {
    expect(prerender).toBeDefined();
    expect(prerender).toContain(LEGACY_PROTECTOR_KEY);
    expect(prerender).toContain(`'${ELDERLY_CLASS}'`);
  });

  it('aplica la clase si el modo quedó activado', () => {
    localStorage.setItem(ELDERLY_STORAGE_KEY, 'true');
    runPrerender();
    expect(document.documentElement).toHaveClass(ELDERLY_CLASS);
  });

  it('no la aplica si el modo está desactivado o nunca se eligió', () => {
    runPrerender();
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);

    localStorage.setItem(ELDERLY_STORAGE_KEY, 'false');
    runPrerender();
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);
  });

  it('respeta la preferencia del Modo Protector Mayor si todavía no hay una nueva', () => {
    localStorage.setItem(LEGACY_PROTECTOR_KEY, 'on');
    runPrerender();
    expect(document.documentElement).toHaveClass(ELDERLY_CLASS);
  });

  it('la preferencia nueva manda sobre la del Modo Protector Mayor', () => {
    localStorage.setItem(ELDERLY_STORAGE_KEY, 'false');
    localStorage.setItem(LEGACY_PROTECTOR_KEY, 'on');
    runPrerender();
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);
  });

  it('no rompe la carga si localStorage está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(runPrerender).not.toThrow();
    expect(document.documentElement).not.toHaveClass(ELDERLY_CLASS);
  });
});
