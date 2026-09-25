import type { LucideIcon } from 'lucide-react';
import type { ChatAnalysisResponse, ChatFollowupResponse } from '../../types';

/** Los 3 momentos críticos de la estafa con los que se puede entrar al chat. */
export type EntryMode = 'PREVENCION' | 'DURANTE' | 'SOS';

export type QuickReply = { label: string; icon: LucideIcon } & (
  | { type: 'entry'; mode: EntryMode }
  | { type: 'analyze'; text: string }
  /** Pregunta de seguimiento sobre el último análisis (FH26-57). */
  | { type: 'ask'; text: string }
);

export type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'bot'; kind: 'text'; text: string; quickReplies?: QuickReply[] }
  | { id: number; role: 'bot'; kind: 'analysis'; analysis: ChatAnalysisResponse; sourceText: string }
  | { id: number; role: 'bot'; kind: 'contention' }
  | { id: number; role: 'bot'; kind: 'followup'; response: ChatFollowupResponse };

/** Mensaje sin id, tal como lo arma el flujo antes de agregarlo a la conversación. */
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;
export type NewChatMessage = WithoutId<ChatMessage>;
