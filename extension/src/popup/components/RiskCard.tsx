import React from 'react';
import {
  ShieldAlert,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  WifiOff,
  Building2,
  Radio,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react';
import type { RiskLevel } from '../../types/analysis.js';
import type { AnalysisStorageItem } from '../../types/extension.js';

export interface RiskCardProps {
  item: AnalysisStorageItem;
  onOpenWebApp?: (text: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  URGENCE: 'Presión de tiempo',
  CREDENTIALS: 'Robo de claves/token',
  FAMILY_IMPERSONATION: 'Suplantación familiar',
  GREED: 'Cebo de dinero/premios',
  AUTHORITY: 'Falsa autoridad',
  FAKE_LINK: 'Enlace engañoso',
};

export const RiskCard: React.FC<RiskCardProps> = ({ item, onOpenWebApp }) => {
  const result = item.result;
  const riskLevel: RiskLevel = result?.risk_level ?? 'LOW';

  const riskConfig = {
    HIGH: {
      title: 'RIESGO ALTO',
      subtitle: 'Alerta crítica de estafa digital detectada',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      containerClass: 'border-red-500/40 bg-red-950/20',
      textClass: 'text-red-400',
      barClass: 'bg-red-500',
      icon: ShieldAlert,
    },
    MEDIUM: {
      title: 'RIESGO MEDIO',
      subtitle: 'Contenido sospechoso con indicadores anómalos',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      containerClass: 'border-amber-500/40 bg-amber-950/20',
      textClass: 'text-amber-400',
      barClass: 'bg-amber-500',
      icon: AlertCircle,
    },
    LOW: {
      title: 'RIESGO BAJO',
      subtitle: 'No se detectaron patrones típicos de fraude',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      containerClass: 'border-emerald-500/40 bg-emerald-950/20',
      textClass: 'text-emerald-400',
      barClass: 'bg-emerald-500',
      icon: ShieldCheck,
    },
  }[riskLevel];

  const IconComponent = riskConfig.icon;
  const percentage = result?.risk_percentage ?? (riskLevel === 'HIGH' ? 85 : riskLevel === 'MEDIUM' ? 50 : 10);

  const handleOpenDeepLink = () => {
    if (onOpenWebApp) {
      onOpenWebApp(item.text);
      return;
    }
    const webAppUrl = `http://localhost:8000/?analyze=${encodeURIComponent(item.text)}`;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: webAppUrl });
    } else {
      window.open(webAppUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Semáforo de Riesgo */}
      <div className={`p-3.5 rounded-2xl border ${riskConfig.containerClass} transition-all`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${riskConfig.badgeClass} border`}>
              <IconComponent className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="truncate">
              <span className={`text-xs font-black tracking-wider uppercase block ${riskConfig.textClass}`}>
                {riskConfig.title}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {riskConfig.subtitle}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xl font-black ${riskConfig.textClass}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Barra medidora */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${riskConfig.barClass} transition-all duration-500`}
            style={{ width: `${Math.min(Math.max(percentage, 5), 100)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Tags de Entidad y Modo Offline */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {result?.detected_entity && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-sky-300 border border-slate-700">
              <Building2 className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />
              {result.detected_entity}
            </span>
          )}
          {result?.detected_vector && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-indigo-300 border border-slate-700">
              <Radio className="w-3 h-3 text-indigo-400 shrink-0" aria-hidden="true" />
              {result.detected_vector}
            </span>
          )}
          {item.isOffline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
              Análisis Heurístico Local
            </span>
          )}
        </div>
      </div>

      {/* Desglose de Manipulaciones Psicológicas */}
      {result?.highlighted_phrases && result.highlighted_phrases.length > 0 && (
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Tag className="w-3.5 h-3.5 text-brand-400" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Manipulaciones Detectadas ({result.highlighted_phrases.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-subtle pr-1">
            {result.highlighted_phrases.map((phrase, idx) => (
              <div
                key={idx}
                className="text-[11px] bg-slate-900/80 rounded-lg p-2 border border-slate-700/50 space-y-0.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-rose-300 truncate">
                    "{phrase.phrase}"
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 shrink-0 uppercase">
                    {CATEGORY_LABELS[phrase.category] || phrase.category}
                  </span>
                </div>
                {phrase.reason && (
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {phrase.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen y Acciones Preventivas */}
      {result && (
        <div className="space-y-2">
          {result.summary && (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40">
              {result.summary}
            </p>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {result.immediate_action && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-semibold block text-emerald-200">Qué hacer:</strong>
                  <span>{result.immediate_action}</span>
                </div>
              </div>
            )}
            {result.what_not_to_do && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-[11px]">
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-semibold block text-red-200">Qué NO hacer:</strong>
                  <span>{result.what_not_to_do}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón CTA Deep-link a Webapp */}
      <button
        type="button"
        onClick={handleOpenDeepLink}
        className="w-full py-2.5 px-3 bg-brand-500 hover:bg-brand-400 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-400"
      >
        <ExternalLink className="w-4 h-4 shrink-0 text-slate-950" aria-hidden="true" />
        <span>Abrir investigación completa en CiberGuardián</span>
      </button>
    </div>
  );
};

export default RiskCard;
