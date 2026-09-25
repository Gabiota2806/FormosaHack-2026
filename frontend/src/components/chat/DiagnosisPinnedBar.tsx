import { ChevronUp } from 'lucide-react';
import type { ChatAnalysisResponse } from '../../types';
import { cn } from '../ui/cn';

const LEVELS: Record<ChatAnalysisResponse['risk_level'], { label: string; dot: string }> = {
  HIGH: { label: 'Riesgo alto', dot: 'bg-red-500' },
  MEDIUM: { label: 'Riesgo medio', dot: 'bg-amber-400' },
  LOW: { label: 'Riesgo bajo', dot: 'bg-brand-400' },
};

interface DiagnosisPinnedBarProps {
  analysis: ChatAnalysisResponse;
  onShowDiagnosis: () => void;
}

/**
 * Resumen fijo del diagnóstico mientras la tarjeta completa está fuera de la vista (FH26-57):
 * al seguir preguntando, la persona no pierde de vista de qué mensaje se trata.
 */
export function DiagnosisPinnedBar({ analysis, onShowDiagnosis }: DiagnosisPinnedBarProps) {
  const level = LEVELS[analysis.risk_level];
  return (
    <button
      type="button"
      onClick={onShowDiagnosis}
      className="flex w-full items-center gap-2.5 border-b border-slate-700/70 bg-slate-900/80 px-4 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400 animate-bubble-in"
    >
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', level.dot)} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        <strong className="font-bold text-white">{level.label}</strong> · {analysis.risk_percentage}%
        {analysis.detected_entity && <> · {analysis.detected_entity}</>}
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold text-brand-400">
        Ver diagnóstico
        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
