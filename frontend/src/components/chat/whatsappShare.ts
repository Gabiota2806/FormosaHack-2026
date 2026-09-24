import type { ChatAnalysisResponse } from '../../types';
import { getCategoryStyle } from './phraseCategories';

/** Largo máximo del mensaje citado, para que el enlace wa.me no quede demasiado largo. */
export const MAX_QUOTE_LENGTH = 500;

const RISK_LABELS: Record<ChatAnalysisResponse['risk_level'], string> = {
  LOW: 'Riesgo bajo',
  MEDIUM: 'Riesgo medio',
  HIGH: 'Riesgo alto',
};

function quote(text: string) {
  const trimmed = text.trim();
  return trimmed.length > MAX_QUOTE_LENGTH ? `${trimmed.slice(0, MAX_QUOTE_LENGTH).trimEnd()}…` : trimmed;
}

/**
 * Texto para consultar a un familiar: incluye el mensaje sospechoso para que
 * la otra persona pueda opinar, y el diagnóstico en lenguaje claro.
 * WhatsApp muestra en negrita lo que va entre asteriscos.
 */
export function buildFamilyShareText(analysis: ChatAnalysisResponse, sourceText: string): string {
  const traps = [...new Set(analysis.highlighted_phrases.map((p) => getCategoryStyle(p.category).label))];

  const lines = [
    'Hola, me llegó este mensaje y antes de responder lo revisé con CiberGuardián:',
    '',
    `"${quote(sourceText)}"`,
    '',
    `Resultado: *${RISK_LABELS[analysis.risk_level]}* (${analysis.risk_percentage}% de probabilidad de engaño)`,
  ];
  if (analysis.detected_entity) lines.push(`Se hace pasar por: ${analysis.detected_entity}`);
  if (traps.length > 0) lines.push(`Trampas que encontró: ${traps.join(', ')}`);
  lines.push('', '¿Lo miramos juntos antes de que haga algo? Gracias.');

  return lines.join('\n');
}

/** Sin número de destino, WhatsApp abre su selector de contactos. */
export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
