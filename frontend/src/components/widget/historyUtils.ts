import type { ChatAnalysisResponse, ChatHistoryEntry } from '../../types';
import type { RestoredConsultation } from './chatWidgetContext';

export const HISTORY_PAGE_SIZE = 10;

export const formatConsultationDate = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const LEVELS: ChatAnalysisResponse['risk_level'][] = ['LOW', 'MEDIUM', 'HIGH'];

/** Convierte una entrada del historial en el diagnóstico que muestra el chat. */
export function toRestoredConsultation(entry: ChatHistoryEntry): RestoredConsultation {
  const level = entry.risk_level.toUpperCase() as ChatAnalysisResponse['risk_level'];
  return {
    sourceText: entry.message,
    analysis: {
      risk_level: LEVELS.includes(level) ? level : 'MEDIUM',
      risk_percentage: entry.risk_percentage,
      detected_entity: entry.detected_entity ?? undefined,
      detected_vector: entry.detected_vector ?? undefined,
      summary: entry.summary,
      immediate_action: entry.immediate_action,
      what_not_to_do: entry.what_not_to_do,
      highlighted_phrases: entry.highlighted_phrases,
      wa_share_text: entry.wa_share_text,
    },
  };
}
