import { describe, it, expect } from 'vitest';
import { validateAnalysisInput, MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } from '../src/utils/validation.js';

describe('validateAnalysisInput', () => {
  it('debe rechazar entradas que no sean string', () => {
    expect(validateAnalysisInput(null).isValid).toBe(false);
    expect(validateAnalysisInput(undefined).isValid).toBe(false);
    expect(validateAnalysisInput(12345).isValid).toBe(false);
    expect(validateAnalysisInput({}).isValid).toBe(false);
  });

  it('debe rechazar textos vacíos o solo con espacios en blanco', () => {
    const result = validateAnalysisInput('     ');
    expect(result.isValid).toBe(false);
    expect(result.charCount).toBe(0);
    expect(result.error).toContain('demasiado corto');
  });

  it(`debe rechazar textos de menos de ${MIN_TEXT_LENGTH} caracteres`, () => {
    const result = validateAnalysisInput('ab');
    expect(result.isValid).toBe(false);
    expect(result.charCount).toBe(2);
    expect(result.error).toContain('mínimo requerido');
  });

  it(`debe aceptar textos en el límite inferior exacto (${MIN_TEXT_LENGTH} caracteres)`, () => {
    const result = validateAnalysisInput('abc');
    expect(result.isValid).toBe(true);
    expect(result.charCount).toBe(3);
    expect(result.sanitizedText).toBe('abc');
  });

  it('debe aceptar textos válidos comunes y sanitizar espacios externos', () => {
    const input = '   Felicitaciones, ganaste un premio de Banco Formosa! Ingresa aquí   ';
    const result = validateAnalysisInput(input);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedText).toBe('Felicitaciones, ganaste un premio de Banco Formosa! Ingresa aquí');
    expect(result.charCount).toBe(result.sanitizedText!.length);
  });

  it(`debe aceptar textos en el límite superior exacto (${MAX_TEXT_LENGTH} caracteres)`, () => {
    const maxText = 'a'.repeat(MAX_TEXT_LENGTH);
    const result = validateAnalysisInput(maxText);
    expect(result.isValid).toBe(true);
    expect(result.charCount).toBe(MAX_TEXT_LENGTH);
  });

  it(`debe rechazar textos que superen los ${MAX_TEXT_LENGTH} caracteres`, () => {
    const overflowText = 'a'.repeat(MAX_TEXT_LENGTH + 1);
    const result = validateAnalysisInput(overflowText);
    expect(result.isValid).toBe(false);
    expect(result.charCount).toBe(MAX_TEXT_LENGTH + 1);
    expect(result.error).toContain('excede el límite permitido');
  });

  it('debe aceptar URLs válidas como enlaces sospechosos', () => {
    const url = 'https://banco-formosa-actualizacion-seguridad.falsoweb.com/login';
    const result = validateAnalysisInput(url);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedText).toBe(url);
  });
});
