import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Share2,
  Info,
} from 'lucide-react';
import type { ChatAnalysisResponse } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { HighlightedMessage } from './HighlightedMessage';

type RiskLevel = ChatAnalysisResponse['risk_level'];

const RISK_STYLES: Record<
  RiskLevel,
  { label: string; accent: string; badge: string; icon: string; bar: string; light: string }
> = {
  HIGH: {
    label: 'Riesgo Alto',
    accent: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: 'bg-red-600 text-white shadow-red-600/30',
    bar: 'from-orange-500 to-red-600',
    light: 'bg-red-500 shadow-[0_0_10px] shadow-red-500',
  },
  MEDIUM: {
    label: 'Riesgo Medio',
    accent: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'bg-amber-400 text-slate-950 shadow-amber-400/30',
    bar: 'from-yellow-400 to-amber-500',
    light: 'bg-amber-400 shadow-[0_0_10px] shadow-amber-400',
  },
  LOW: {
    label: 'Riesgo Bajo',
    accent: 'bg-brand-500',
    badge: 'bg-brand-50 text-brand-700 border-brand-100',
    icon: 'bg-brand-500 text-white shadow-brand-500/30',
    bar: 'from-teal-400 to-brand-500',
    light: 'bg-brand-400 shadow-[0_0_10px] shadow-brand-400',
  },
};

/** Orden de las luces del semáforo, de arriba (rojo) hacia abajo (verde). */
const LIGHT_ORDER: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

function TrafficLight({ level }: { level: RiskLevel }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-1.5 rounded-xl bg-slate-800 shadow-inner"
      role="img"
      aria-label={`Semáforo: ${RISK_STYLES[level].label}`}
    >
      {LIGHT_ORDER.map((l) => (
        <span
          key={l}
          className={`w-3.5 h-3.5 rounded-full ${
            l === level ? `${RISK_STYLES[l].light} animate-light-on [animation-delay:200ms]` : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

interface RiskAnalysisCardProps {
  analysis: ChatAnalysisResponse;
  /** Mensaje que analizó el usuario, para resaltar las trampas dentro del texto. */
  sourceText: string;
  onShareWhatsApp: () => void;
  onReport?: () => void;
}

export function RiskAnalysisCard({ analysis, sourceText, onShareWhatsApp, onReport }: RiskAnalysisCardProps) {
  const style = RISK_STYLES[analysis.risk_level];
  const RiskIcon =
    analysis.risk_level === 'HIGH' ? ShieldAlert : analysis.risk_level === 'MEDIUM' ? AlertTriangle : ShieldCheck;

  return (
    <Card className="rounded-bl-md">
      <div className={`h-1.5 ${style.accent}`} />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Cabecera del semáforo */}
        <div className="flex items-center gap-3">
          <TrafficLight level={analysis.risk_level} />
          <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-lg ${style.icon}`}>
            <RiskIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {style.label}
              </span>
              {analysis.detected_entity && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  Suplanta a: <strong className="text-slate-800">{analysis.detected_entity}</strong>
                </span>
              )}
            </div>
            <p className="text-base font-bold text-slate-900 mt-1">
              Probabilidad de engaño: {analysis.risk_percentage}%
            </p>
            <div className="mt-1.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r origin-left animate-grow-x ${style.bar}`}
                style={{ width: `${analysis.risk_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Diagnóstico en lenguaje claro */}
        <p className="text-sm text-slate-800 font-medium leading-relaxed">{analysis.summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
            <div className="flex items-center gap-1.5 text-brand-700 font-semibold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Qué deberías hacer ahora
            </div>
            <p className="text-xs text-slate-700 leading-normal">{analysis.immediate_action}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-1.5 text-red-700 font-semibold text-xs mb-1">
              <XCircle className="w-4 h-4" />
              Qué NUNCA debés hacer
            </div>
            <p className="text-xs text-slate-700 leading-normal">{analysis.what_not_to_do}</p>
          </div>
        </div>

        {/* Mensaje original con las trampas resaltadas */}
        {analysis.highlighted_phrases.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              Tu mensaje, con las trampas marcadas
            </h4>
            <HighlightedMessage text={sourceText} phrases={analysis.highlighted_phrases} />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <Button icon={Share2} onClick={onShareWhatsApp}>
            Consultar con un familiar por WhatsApp
          </Button>
          {onReport && analysis.risk_level !== 'LOW' && (
            <Button variant="secondary" icon={ShieldAlert} onClick={onReport}>
              Advertir a la comunidad en el Radar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
