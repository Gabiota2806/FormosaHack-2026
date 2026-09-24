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

type RiskLevel = ChatAnalysisResponse['risk_level'];

const RISK_STYLES: Record<
  RiskLevel,
  { label: string; card: string; badge: string; icon: string; bar: string; light: string }
> = {
  HIGH: {
    label: 'Riesgo Alto',
    card: 'border-red-800/80 bg-red-950/30',
    badge: 'bg-red-900/60 text-red-300 border-red-700',
    icon: 'bg-red-600 text-white shadow-red-600/30',
    bar: 'from-orange-500 to-red-600',
    light: 'bg-red-500 shadow-[0_0_12px] shadow-red-500',
  },
  MEDIUM: {
    label: 'Riesgo Medio',
    card: 'border-amber-800/80 bg-amber-950/30',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700',
    icon: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
    bar: 'from-yellow-500 to-amber-500',
    light: 'bg-amber-400 shadow-[0_0_12px] shadow-amber-400',
  },
  LOW: {
    label: 'Riesgo Bajo',
    card: 'border-emerald-800/80 bg-emerald-950/30',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
    icon: 'bg-emerald-500 text-slate-950 shadow-emerald-500/30',
    bar: 'from-teal-500 to-emerald-500',
    light: 'bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400',
  },
};

/** Orden de las luces del semáforo, de arriba (rojo) hacia abajo (verde). */
const LIGHT_ORDER: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

function TrafficLight({ level }: { level: RiskLevel }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800"
      role="img"
      aria-label={`Semáforo: ${RISK_STYLES[level].label}`}
    >
      {LIGHT_ORDER.map((l) => (
        <span
          key={l}
          className={`w-3.5 h-3.5 rounded-full transition-all ${l === level ? RISK_STYLES[l].light : 'bg-slate-800'}`}
        />
      ))}
    </div>
  );
}

interface RiskAnalysisCardProps {
  analysis: ChatAnalysisResponse;
  onShareWhatsApp: () => void;
  onReport?: () => void;
}

export function RiskAnalysisCard({ analysis, onShareWhatsApp, onReport }: RiskAnalysisCardProps) {
  const style = RISK_STYLES[analysis.risk_level];
  const RiskIcon =
    analysis.risk_level === 'HIGH' ? ShieldAlert : analysis.risk_level === 'MEDIUM' ? AlertTriangle : ShieldCheck;

  return (
    <div className={`rounded-2xl rounded-bl-md border p-4 sm:p-5 space-y-4 ${style.card}`}>
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
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Suplanta a: <strong>{analysis.detected_entity}</strong>
              </span>
            )}
          </div>
          <p className="text-base font-bold text-white mt-1">
            Probabilidad de engaño: {analysis.risk_percentage}%
          </p>
          <div className="mt-1.5 w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${style.bar}`}
              style={{ width: `${analysis.risk_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Diagnóstico en lenguaje claro */}
      <p className="text-sm text-slate-100 font-medium leading-relaxed">{analysis.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Qué deberías hacer ahora
          </div>
          <p className="text-xs text-slate-300 leading-normal">{analysis.immediate_action}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs mb-1">
            <XCircle className="w-4 h-4" />
            Qué NUNCA debés hacer
          </div>
          <p className="text-xs text-slate-300 leading-normal">{analysis.what_not_to_do}</p>
        </div>
      </div>

      {/* Trampas detectadas (el resaltado dentro del texto original es TASK-011) */}
      {analysis.highlighted_phrases.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Trampas detectadas en el mensaje
          </h4>
          <ul className="space-y-2">
            {analysis.highlighted_phrases.map((h, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50 break-all">
                  "{h.phrase}"
                </span>
                <p className="text-slate-400 mt-1.5 leading-relaxed">{h.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onShareWhatsApp}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Share2 className="w-4 h-4" />
          Consultar con un familiar por WhatsApp
        </button>
        {onReport && analysis.risk_level !== 'LOW' && (
          <button
            type="button"
            onClick={onReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Advertir a la comunidad en el Radar
          </button>
        )}
      </div>
    </div>
  );
}
