import { AlertTriangle, CircleCheck, MessageCircle, OctagonAlert, PhoneCall, type LucideIcon } from 'lucide-react';
import type { ChatAnalysisResponse } from '../../types';
import { EMERGENCY_CONTACTS, toTelHref } from '../sos/emergencyContacts';
import { cn } from '../ui/cn';

type RiskLevel = ChatAnalysisResponse['risk_level'];

/**
 * Textos fijos en lenguaje cotidiano: el summary del backend puede traer jerga
 * ("ALERTA ROJA", "vector", porcentajes), que en el Modo Abuelo confunde más de lo que ayuda.
 */
const VERDICTS: Record<RiskLevel, { title: string; lines: [string, string]; icon: LucideIcon; className: string }> = {
  HIGH: {
    title: '¡Cuidado! Es una trampa para sacarte plata',
    lines: ['No contestes ni toques ningún link.', 'No des claves, códigos ni el token a nadie.'],
    icon: OctagonAlert,
    className: 'bg-red-600 text-white',
  },
  MEDIUM: {
    title: '¡Ojo! Este mensaje es sospechoso',
    lines: ['No contestes todavía ni toques ningún link.', 'Antes, consultalo con alguien de tu familia.'],
    icon: AlertTriangle,
    className: 'bg-amber-300 text-slate-950',
  },
  LOW: {
    title: 'Este mensaje parece seguro',
    lines: ['No encontramos señales de estafa.', 'Igual, nunca des tus claves ni el token a nadie.'],
    icon: CircleCheck,
    className: 'bg-brand-500 text-slate-950',
  },
};

const BANK = EMERGENCY_CONTACTS.find((c) => c.name.startsWith('Banco Formosa'));

const ACTION_CLASSES =
  'flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-base font-extrabold leading-tight transition-colors sm:text-lg focus-visible:outline-4 focus-visible:outline-offset-2';

interface ElderlyVerdictCardProps {
  analysis: ChatAnalysisResponse;
  onShareWhatsApp: () => void;
}

/** Resultado del análisis en el Modo Abuelo: un veredicto gigante, dos renglones y dos botones. */
export function ElderlyVerdictCard({ analysis, onShareWhatsApp }: ElderlyVerdictCardProps) {
  const verdict = VERDICTS[analysis.risk_level];
  const Icon = verdict.icon;
  const lines =
    analysis.risk_level !== 'LOW' && analysis.detected_entity
      ? [`Se hacen pasar por ${analysis.detected_entity}.`, verdict.lines[1]]
      : verdict.lines;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <div className={cn('flex items-center gap-3 p-4 sm:p-5', verdict.className)}>
        <Icon className="h-10 w-10 shrink-0 max-sm:hidden" aria-hidden="true" />
        <p className="min-w-0 break-words text-lg font-extrabold uppercase leading-tight sm:text-2xl" role="status">
          {verdict.title}
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <ul className="space-y-1 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onShareWhatsApp}
            className={cn(ACTION_CLASSES, 'bg-brand-500 text-slate-950 hover:bg-brand-400 focus-visible:outline-brand-600')}
          >
            <MessageCircle className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" aria-hidden="true" />
            Avisar a un familiar por WhatsApp
          </button>
          {BANK && (
            <a
              href={toTelHref(BANK.phone)}
              aria-label={`Llamar al Banco Formosa al ${BANK.phone}`}
              className={cn(ACTION_CLASSES, 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900')}
            >
              <PhoneCall className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" aria-hidden="true" />
              Llamar al banco
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
