import { ChevronRight, MessageCircle, PhoneOff, Search, type LucideIcon } from 'lucide-react';
import { buildWhatsAppUrl } from '../chat/whatsappShare';
import { cn } from '../ui/cn';
import type { LandingProps } from '../landing/types';

/** Texto para pedir ayuda a un familiar; sin número, WhatsApp deja elegir el contacto. */
export const FAMILY_HELP_TEXT =
  'Hola, necesito que me ayudes: me llegó un mensaje (o me llamaron) y no sé si es una estafa. ¿Me podés llamar?';

// En celular el ícono va arriba del texto: al lado, con la letra de 22px, dejaba una palabra por renglón.
const ACTION_CLASSES =
  'group flex w-full min-h-16 flex-col items-start gap-3 rounded-3xl border-2 p-4 text-left transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-5 focus-visible:outline-4 focus-visible:outline-offset-2';

function ActionContent({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/15">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 break-words">
        <span className="block text-xl font-extrabold leading-tight">{title}</span>
        <span className="mt-1 block text-base leading-snug opacity-90">{hint}</span>
      </span>
      <ChevronRight className="h-8 w-8 shrink-0 max-sm:hidden" aria-hidden="true" />
    </>
  );
}

/**
 * Inicio del Modo Abuelo: en lugar de la landing, tres botones gigantes para lo único
 * que hace falta en el momento (revisar un mensaje, avisar a la familia, cortar una llamada).
 */
export function ElderlyHomeView({ onAction }: LandingProps) {
  return (
    <section aria-labelledby="elderly-home-title" className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div className="space-y-2">
        <h1 id="elderly-home-title" className="text-3xl font-extrabold leading-tight text-white">
          ¿En qué te ayudamos?
        </h1>
        <p className="text-lg text-slate-300">Tocá uno de los tres botones.</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onAction('ANALYZE')}
          className={cn(ACTION_CLASSES, 'border-brand-400 bg-brand-500 text-slate-950 hover:bg-brand-400 focus-visible:outline-brand-300')}
        >
          <ActionContent
            icon={Search}
            title="Pegar mensaje para revisar si es mentira"
            hint="Copiá el mensaje raro y te decimos si es una trampa."
          />
        </button>

        <a
          href={buildWhatsAppUrl(FAMILY_HELP_TEXT)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(ACTION_CLASSES, 'border-slate-500 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-brand-300')}
        >
          <ActionContent
            icon={MessageCircle}
            title="Avisar a mi hijo / familiar por WhatsApp"
            hint="Le mandás un mensaje pidiendo que te llame."
          />
        </a>

        <button
          type="button"
          onClick={() => onAction('DURING_CALL')}
          className={cn(ACTION_CLASSES, 'border-red-400 bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-300')}
        >
          <ActionContent
            icon={PhoneOff}
            title="¡Me están llamando y tengo miedo!"
            hint="Ayuda inmediata: qué hacer ahora mismo."
          />
        </button>
      </div>
    </section>
  );
}
