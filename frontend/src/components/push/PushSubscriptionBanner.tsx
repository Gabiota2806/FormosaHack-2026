import { useEffect, useState } from 'react';
import { BellOff, BellRing, CheckCircle2, Loader2, Share, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  PushError,
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  type PushErrorCode,
  type PushStatus,
} from '../../pwa/pushSubscription';
import { Button } from '../ui/Button';
import { IconBadge } from '../ui/IconBadge';
import { cn } from '../ui/cn';

const ERROR_MESSAGES: Record<PushErrorCode, string> = {
  'not-configured': 'Las alertas todavía no están disponibles en el servidor. Probá más tarde.',
  'no-service-worker': 'Las alertas funcionan en la versión publicada de CiberGuardián, no en la de desarrollo.',
  denied: 'Bloqueaste las notificaciones. Podés habilitarlas desde el candado junto a la dirección de la página.',
  dismissed: 'No activamos las alertas: el navegador no recibió el permiso.',
  'push-service':
    'Este navegador no pudo registrarse para recibir notificaciones. Probá con Chrome, fuera de la ventana privada.',
  server: 'No pudimos activar las alertas. Revisá tu conexión y volvé a intentar.',
};

const COPY: Record<'default' | 'subscribed' | 'denied' | 'ios-install', { title: string; text: string; icon: LucideIcon }> = {
  default: {
    title: 'Enterate antes que nadie de un brote de estafas',
    text: 'Te avisamos en el celular cuando muchos vecinos reportan la misma estafa, aunque tengas el navegador cerrado.',
    icon: BellRing,
  },
  subscribed: {
    title: 'Alertas activadas con éxito',
    text: 'Te vamos a avisar en este dispositivo cuando haya un brote de estafas en Formosa.',
    icon: CheckCircle2,
  },
  denied: {
    title: 'Las notificaciones están bloqueadas',
    text: 'Para recibir alertas, tocá el candado junto a la dirección de la página, habilitá "Notificaciones" y recargá.',
    icon: BellOff,
  },
  'ios-install': {
    title: 'En iPhone, instalá la app para recibir alertas',
    text: 'Tocá Compartir y después "Agregar a inicio". Abrí CiberGuardián desde ese ícono y activá las alertas.',
    icon: Share,
  },
};

/** Banner de suscripción a las alertas push de brotes (FH26-76). */
export function PushSubscriptionBanner() {
  // null mientras se consulta el estado: no se muestra nada para no parpadear.
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPushStatus()
      .then((s) => active && setStatus(s))
      .catch(() => active && setStatus('unsupported'));
    return () => {
      active = false;
    };
  }, []);

  if (status === null || status === 'unsupported') return null;

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
      setStatus('subscribed');
      toast.success('Alertas activadas con éxito. Te avisamos ante un brote de estafas.');
    } catch (error) {
      const code = error instanceof PushError ? error.code : 'server';
      if (code === 'denied') setStatus('denied');
      toast.error(ERROR_MESSAGES[code]);
    } finally {
      setBusy(false);
    }
  };

  const handleUnsubscribe = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setStatus('default');
      toast.success('Desactivamos las alertas en este dispositivo.');
    } catch {
      toast.error('No pudimos desactivar las alertas. Volvé a intentar.');
    } finally {
      setBusy(false);
    }
  };

  const copy = COPY[status];
  const subscribed = status === 'subscribed';

  return (
    <section
      aria-labelledby="push-banner-title"
      className={cn(
        'p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up',
        subscribed ? 'bg-brand-500/10 border-brand-500/40' : 'bg-slate-800/70 border-slate-700',
      )}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <IconBadge icon={copy.icon} tone={status === 'denied' ? 'danger' : 'brand'} size="md" className="shrink-0" />
        <div className="min-w-0">
          <h3 id="push-banner-title" className="text-base font-bold text-white">
            {copy.title}
          </h3>
          <p className="text-sm text-slate-300 mt-0.5">{copy.text}</p>
        </div>
      </div>

      {status === 'default' && (
        <Button
          icon={busy ? Loader2 : BellRing}
          onClick={handleSubscribe}
          disabled={busy}
          aria-busy={busy}
          className={cn('w-full sm:w-auto shrink-0 py-3', busy && '[&>svg]:animate-spin')}
        >
          {busy ? 'Activando…' : 'Activar alertas de brotes de estafas'}
        </Button>
      )}
      {subscribed && (
        <Button
          variant="ghost"
          icon={busy ? Loader2 : BellOff}
          onClick={handleUnsubscribe}
          disabled={busy}
          aria-busy={busy}
          className={cn('w-full sm:w-auto shrink-0 border border-slate-600', busy && '[&>svg]:animate-spin')}
        >
          Desactivar alertas
        </Button>
      )}
    </section>
  );
}
