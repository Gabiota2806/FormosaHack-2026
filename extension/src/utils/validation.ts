import { ValidationResult } from '../types/extension.js';

export const MIN_TEXT_LENGTH = 3;
export const MAX_TEXT_LENGTH = 2000;

export function validateAnalysisInput(input: unknown): ValidationResult {
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: 'El contenido a analizar debe ser una cadena de texto.',
      charCount: 0,
    };
  }

  const sanitized = input.trim();
  const charCount = sanitized.length;

  if (charCount < MIN_TEXT_LENGTH) {
    return {
      isValid: false,
      error: `El texto seleccionado es demasiado corto (${charCount} caracteres). El mínimo requerido es de ${MIN_TEXT_LENGTH} caracteres.`,
      sanitizedText: sanitized,
      charCount,
    };
  }

  if (charCount > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: `El texto seleccionado excede el límite permitido (${charCount} caracteres). El máximo es de ${MAX_TEXT_LENGTH} caracteres.`,
      sanitizedText: sanitized,
      charCount,
    };
  }

  return {
    isValid: true,
    sanitizedText: sanitized,
    charCount,
  };
}
