import { Calendar, Check, MessageCircle, ThumbsUp } from 'lucide-react';
import type { IncidentItem } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../ui/cn';
import { reportsLabel, vectorLabel } from './radarLabels';

interface IncidentCardProps {
  item: IncidentItem;
  voted: boolean;
  voting: boolean;
  onVote: (id: number) => void;
}

const CHIP = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full';

export function IncidentCard({ item, voted, voting, onVote }: IncidentCardProps) {
  const titleId = `incident-${item.id}-title`;

  return (
    <Card className="flex flex-col animate-fade-up">
      <article aria-labelledby={titleId} className="flex-1 flex flex-col">
        <div className={cn('h-1.5', item.is_outbreak_spike ? 'bg-red-500' : 'bg-brand-500')} aria-hidden="true" />
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(CHIP, 'bg-brand-50 text-brand-700 border border-brand-100')}>
                  {item.impersonated_entity}
                </span>
                <span className={cn(CHIP, 'bg-slate-100 text-slate-600')}>{vectorLabel(item.attack_vector)}</span>
                {item.is_outbreak_spike && (
                  <span className={cn(CHIP, 'font-extrabold bg-red-600 text-white motion-safe:animate-pulse')}>
                    En Brote
                  </span>
                )}
              </div>
              <time
                dateTime={item.created_at}
                className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0"
              >
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {new Date(item.created_at).toLocaleDateString('es-AR')}
              </time>
            </div>

            <h3 id={titleId} className="font-bold text-sm text-slate-900 mb-1.5">
              {item.title}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">{item.description}</p>

            {item.evidence_text && (
              <blockquote className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 mb-3 flex items-center gap-1.5 min-w-0">
                <MessageCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                <span className="truncate" title={item.evidence_text}>
                  "{item.evidence_text}"
                </span>
              </blockquote>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">{reportsLabel(item.votes_count)}</span>

            <Button
              size="sm"
              variant={voted ? 'secondary' : 'primary'}
              icon={voted ? Check : ThumbsUp}
              onClick={() => onVote(item.id)}
              disabled={voted || voting}
              aria-pressed={voted}
              aria-label={
                voted
                  ? `Ya avisaste que te llegó: ${item.title}`
                  : `A mí también me llegó: ${item.title}`
              }
            >
              {voted ? 'Ya avisaste' : voting ? 'Enviando...' : 'A mí también me llegó'}
            </Button>
          </div>
        </div>
      </article>
    </Card>
  );
}

export function IncidentCardSkeleton() {
  return (
    <Card className="p-5 space-y-3" aria-hidden="true">
      <div className="flex gap-2">
        <div className="h-4 w-24 rounded-full bg-slate-200 motion-safe:animate-pulse" />
        <div className="h-4 w-16 rounded-full bg-slate-200 motion-safe:animate-pulse" />
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-200 motion-safe:animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100 motion-safe:animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-slate-100 motion-safe:animate-pulse" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <div className="h-3 w-28 rounded bg-slate-100 motion-safe:animate-pulse" />
        <div className="h-7 w-36 rounded-lg bg-slate-200 motion-safe:animate-pulse" />
      </div>
    </Card>
  );
}
