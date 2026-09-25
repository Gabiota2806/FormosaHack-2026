import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, History, RefreshCw, Trash2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { historyApi } from '../../services/api';
import type { ChatHistoryEntry } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { cn } from '../ui/cn';
import { HISTORY_PAGE_SIZE, formatConsultationDate } from './historyUtils';

const RISK: Record<string, { label: string; dot: string; badge: string }> = {
  HIGH: { label: 'Riesgo alto', dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-300 border-red-500/40' },
  MEDIUM: { label: 'Riesgo medio', dot: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-200 border-amber-400/40' },
  LOW: { label: 'Riesgo bajo', dot: 'bg-brand-400', badge: 'bg-brand-400/15 text-brand-300 border-brand-400/40' },
};
const riskOf = (level: string) => RISK[level.toUpperCase()] ?? RISK.MEDIUM;

interface ChatHistoryViewProps {
  onBack: () => void;
  onRestore: (entry: ChatHistoryEntry) => void;
  /** Controles del panel (minimizar), igual que en el chat. */
  headerActions?: ReactNode;
}

/** "Mis consultas" (FH26-89): historial paginado del usuario, con restaurar y borrar. */
export function ChatHistoryView({ onBack, onRestore, headerActions }: ChatHistoryViewProps) {
  const [items, setItems] = useState<ChatHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [toDelete, setToDelete] = useState<ChatHistoryEntry | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    historyApi
      .list({ page: 1, limit: HISTORY_PAGE_SIZE }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setPage(1);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [reloadCount]);

  const retry = () => {
    setStatus('loading');
    setReloadCount((n) => n + 1);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await historyApi.list({ page: page + 1, limit: HISTORY_PAGE_SIZE });
      setItems((prev) => [...prev, ...res.items.filter((it) => !prev.some((p) => p.id === it.id))]);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      // El interceptor de api.ts ya avisó el error.
    } finally {
      setLoadingMore(false);
    }
  };

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const entry = toDelete;
    setToDelete(null);
    try {
      await historyApi.deleteEntry(entry.id);
      setItems((prev) => prev.filter((it) => it.id !== entry.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Consulta borrada de tu historial.');
    } catch {
      // El interceptor de api.ts ya avisó el error; la consulta queda en la lista.
    }
  }, [toDelete]);

  const hasMore = items.length < total;

  return (
    <div className="flex h-full flex-col bg-slate-800 text-slate-100">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 bg-slate-800/80 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
            aria-label="Volver al chat"
            title="Volver al chat"
            className="h-9 w-9 px-0"
          />
          <h2 className="truncate font-bold leading-tight text-white">Mis consultas</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-300">
            <RefreshCw className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            Cargando tus consultas…
          </p>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-10 text-center text-sm text-slate-300">
            <WifiOff className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
            <p>No pudimos cargar tu historial.</p>
            <Button icon={RefreshCw} onClick={retry}>
              Reintentar
            </Button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="space-y-2 py-10 text-center text-sm text-slate-300">
            <History className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
            <p>Todavía no tenés consultas guardadas.</p>
            <p className="text-xs text-slate-400">Los mensajes que analices van a aparecer acá.</p>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <>
            <ul className="space-y-2" aria-label="Consultas guardadas">
              {items.map((entry) => {
                const risk = riskOf(entry.risk_level);
                const date = formatConsultationDate(entry.created_at);
                return (
                  <li key={entry.id} className="flex items-stretch gap-1 rounded-2xl border border-slate-700 bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => onRestore(entry)}
                      className="min-w-0 flex-1 rounded-2xl p-3 text-left transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-brand-400"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold',
                            risk.badge,
                          )}
                        >
                          <span className={cn('h-2 w-2 rounded-full', risk.dot)} aria-hidden="true" />
                          {risk.label}
                        </span>
                        {entry.detected_entity && (
                          <span className="text-[11px] font-semibold text-slate-300">{entry.detected_entity}</span>
                        )}
                        <time dateTime={entry.created_at} className="ml-auto text-[11px] text-slate-400">
                          {date}
                        </time>
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-xs text-slate-300">{entry.message}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setToDelete(entry)}
                      aria-label={`Borrar la consulta del ${date}`}
                      title="Borrar"
                      className="h-auto w-10 shrink-0 rounded-2xl px-0 hover:text-red-300"
                    />
                  </li>
                );
              })}
            </ul>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border border-slate-600"
                >
                  {loadingMore ? 'Cargando…' : 'Ver más consultas'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Portal: el panel del widget usa transform y encerraría un modal fixed dentro de él. */}
      {createPortal(
        <ConfirmModal
          isOpen={toDelete !== null}
          title="Borrar consulta"
          message={
            toDelete
              ? `Se va a borrar de tu historial la consulta del ${formatConsultationDate(toDelete.created_at)}.`
              : ''
          }
          confirmText="Borrar"
          isDestructive
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />,
        document.body,
      )}
    </div>
  );
}
