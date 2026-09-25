import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Send, RotateCcw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { IconBadge } from '../ui/IconBadge';
import { ChatBubble } from './ChatBubble';
import { ContentionCard } from './ContentionCard';
import { RiskAnalysisCard } from './RiskAnalysisCard';
import { ElderlyVerdictCard } from '../elderly/ElderlyVerdictCard';
import { useElderlyMode } from '../elderly/elderlyMode';
import { TypingIndicator } from './TypingIndicator';
import {
  AFTER_CONTENTION_TEXT,
  ANALYSIS_ERROR_TEXT,
  ENTRY_OPTIONS,
  ENTRY_QUICK_REPLIES,
  EXAMPLE_MESSAGES,
  PREVENTION_TEXT,
  SOS_TEXT,
  WELCOME_TEXT,
} from './scripts';
import type { ChatMessage, EntryMode, NewChatMessage, QuickReply } from './types';
import { buildFamilyShareText, buildWhatsAppUrl } from './whatsappShare';

interface ChatAssistantProps {
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
  onOpenSos?: () => void;
  /** Controles extra en el encabezado del chat (p. ej. minimizar el panel del widget). */
  headerActions?: ReactNode;
  /**
   * Pedido para el chat, que vive montado dentro del widget: arrancar un momento (landing,
   * Modo Abuelo) o analizar un mensaje (compartido desde WhatsApp).
   * Se ejecuta una sola vez por id y se confirma con onRequestHandled.
   */
  request?: { id: number; entry?: EntryMode; message?: string } | null;
  onRequestHandled?: (id: number) => void;
  /** Avisa si hay conversación o un borrador escrito (indicador del botón flotante). */
  onActivityChange?: (active: boolean) => void;
}

// Límites del backend (ChatMessageRequest.message)
const MIN_LENGTH = 3;
const MAX_LENGTH = 2000;

/** Pausa antes de las respuestas guionadas para que el bot no conteste "en seco". */
const SCRIPTED_REPLY_DELAY_MS = 700;

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: 'bot',
  kind: 'text',
  text: WELCOME_TEXT,
  quickReplies: ENTRY_QUICK_REPLIES,
};

export function ChatAssistant({
  onReportIncident,
  onOpenSos,
  headerActions,
  request,
  onRequestHandled,
  onActivityChange,
}: ChatAssistantProps) {
  // En Modo Abuelo el análisis se muestra como un veredicto simple, sin porcentajes ni jerga, y en
  // celular se esconde lo accesorio del chat: con la letra de 22px, la conversación quedaba en una franja.
  const { enabled: elderlyMode } = useElderlyMode();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const nextId = useRef(1);
  const pendingTimers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Las respuestas guionadas no se cancelan al desmontar: StrictMode simula un desmontaje y
  // las perdería. En cambio, cada respuesta verifica que el chat siga montado.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const lastNode = el.lastElementChild;
    // En Modo Abuelo el veredicto es más alto que la conversación: se muestra desde su título, no desde el final.
    if (elderlyMode && !isTyping && last.role === 'bot' && last.kind === 'analysis' && lastNode) {
      const top = el.scrollTop + lastNode.getBoundingClientRect().top - el.getBoundingClientRect().top - 12;
      el.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, elderlyMode]);

  const pushMessages = useCallback((...newMessages: NewChatMessage[]) => {
    setMessages((prev) => [
      ...prev,
      ...newMessages.map((m) => ({ ...m, id: nextId.current++ }) as ChatMessage),
    ]);
  }, []);

  const requestAnalysis = useCallback(
    async (text: string) => {
      setIsTyping(true);
      try {
        const analysis = await chatApi.analyzeMessage(text);
        pushMessages({ role: 'bot', kind: 'analysis', analysis, sourceText: text });
      } catch {
        // El interceptor de api.ts ya mostró el toast; el chat deja una guía mínima.
        pushMessages({ role: 'bot', kind: 'text', text: ANALYSIS_ERROR_TEXT });
      } finally {
        setIsTyping(false);
      }
    },
    [pushMessages],
  );

  const replyAfterDelay = useCallback(
    (replies: NewChatMessage[], onDone?: () => void) => {
      setIsTyping(true);
      const timer = window.setTimeout(() => {
        if (!mounted.current) return;
        setIsTyping(false);
        pushMessages(...replies);
        onDone?.();
      }, SCRIPTED_REPLY_DELAY_MS);
      pendingTimers.current.push(timer);
    },
    [pushMessages],
  );

  const entryReplies = useCallback(
    (mode: EntryMode): { replies: NewChatMessage[]; onDone?: () => void } => {
      switch (mode) {
        case 'PREVENCION':
          return {
            replies: [{ role: 'bot', kind: 'text', text: PREVENTION_TEXT, quickReplies: EXAMPLE_MESSAGES }],
            onDone: () => inputRef.current?.focus(),
          };
        case 'DURANTE':
          return {
            replies: [
              { role: 'bot', kind: 'contention' },
              { role: 'bot', kind: 'text', text: AFTER_CONTENTION_TEXT },
            ],
          };
        case 'SOS':
          return { replies: [{ role: 'bot', kind: 'text', text: SOS_TEXT }], onDone: onOpenSos };
      }
    },
    [onOpenSos],
  );

  const handleEntry = useCallback(
    (mode: EntryMode) => {
      const option = ENTRY_OPTIONS.find((o) => o.mode === mode)!;
      pushMessages({ role: 'user', text: option.userText });
      const { replies, onDone } = entryReplies(mode);
      replyAfterDelay(replies, onDone);
    },
    [pushMessages, entryReplies, replyAfterDelay],
  );

  const handleAnalyze = async (rawText: string) => {
    const text = rawText.trim();
    if (text.length < MIN_LENGTH) {
      toast.error('Escribí o pegá el mensaje sospechoso para poder analizarlo.');
      return;
    }

    pushMessages({ role: 'user', text });
    setInputText('');
    await requestAnalysis(text);
  };

  // Pedidos del widget. No usa handleAnalyze: no debe borrar un borrador que la persona esté escribiendo.
  const handledRequestId = useRef<number | null>(null);
  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;
    onRequestHandled?.(request.id);

    const message = request.message?.trim();
    if (message && message.length >= MIN_LENGTH) {
      pushMessages({ role: 'user', text: message });
      // El efecto procesa un pedido externo (el widget): marcar "escribiendo" acá es la sincronización.
      // oxlint-disable-next-line react/set-state-in-effect
      requestAnalysis(message);
    } else if (request.entry) {
      handleEntry(request.entry);
    }
  }, [request, onRequestHandled, pushMessages, requestAnalysis, handleEntry]);

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.type === 'entry') handleEntry(reply.mode);
    else handleAnalyze(reply.text);
  };

  const handleShareWhatsApp = (analysis: ChatAnalysisResponse, sourceText: string) => {
    window.open(buildWhatsAppUrl(buildFamilyShareText(analysis, sourceText)), '_blank', 'noopener');
    toast.success('Abriendo WhatsApp para consultar con tu contacto de confianza.');
  };

  const handleReport = (analysis: ChatAnalysisResponse, sourceText: string) => {
    if (!onReportIncident) return;
    onReportIncident(
      `Sospecha de estafa: ${analysis.detected_entity || 'Entidad no identificada'}`,
      analysis.detected_entity || 'Otro',
      analysis.detected_vector || 'WHATSAPP',
      sourceText,
    );
  };

  const handleReset = () => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
    setIsTyping(false);
    setInputText('');
    setMessages([WELCOME_MESSAGE]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!isTyping) handleAnalyze(inputText);
    }
  };

  const hasStarted = messages.length > 1;
  const isActive = hasStarted || inputText.trim().length > 0;

  useEffect(() => {
    onActivityChange?.(isActive);
  }, [isActive, onActivityChange]);

  const renderMessage = (msg: ChatMessage) => {
    if (msg.role === 'user') {
      return <ChatBubble role="user">{msg.text}</ChatBubble>;
    }

    switch (msg.kind) {
      case 'text':
        return (
          <ChatBubble role="bot">
            <p className="px-4 py-2.5 whitespace-pre-wrap">{msg.text}</p>
            {msg.quickReplies && (
              <div className="px-3 pb-3 flex flex-col gap-2">
                {msg.quickReplies.map((reply) => (
                  <button
                    key={reply.label}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleQuickReply(reply)}
                    className="group text-left text-sm font-medium px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 hover:border-brand-400 hover:bg-white hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center gap-3"
                  >
                    <IconBadge
                      icon={reply.icon}
                      tone={reply.type === 'entry' && reply.mode === 'SOS' ? 'danger' : 'brand'}
                    />
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </ChatBubble>
        );
      case 'analysis':
        return (
          // En Modo Abuelo el veredicto va a todo el ancho, sin el avatar: con la letra de 22px no entraba.
          elderlyMode ? (
            <div className="animate-bubble-in">
              <ElderlyVerdictCard
                analysis={msg.analysis}
                onShareWhatsApp={() => handleShareWhatsApp(msg.analysis, msg.sourceText)}
              />
            </div>
          ) : (
            <ChatBubble role="bot" wide>
              <RiskAnalysisCard
                analysis={msg.analysis}
                sourceText={msg.sourceText}
                onShareWhatsApp={() => handleShareWhatsApp(msg.analysis, msg.sourceText)}
                onReport={onReportIncident ? () => handleReport(msg.analysis, msg.sourceText) : undefined}
              />
            </ChatBubble>
          )
        );
      case 'contention':
        return (
          <ChatBubble role="bot" wide>
            <ContentionCard />
          </ChatBubble>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-800 text-slate-100">
      {/* Cabecera del chat */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-700/70 bg-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white leading-tight">Asistente CiberGuardián</h2>
          <p className={cn('text-xs text-slate-400 flex items-center gap-1.5', elderlyMode && 'max-sm:hidden')}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" aria-hidden="true" />
            Sin registro · No guardamos tus mensajes
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasStarted && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset}>
              <span className={cn(elderlyMode && 'max-sm:sr-only')}>Nueva consulta</span>
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Conversación */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Conversación con CiberGuardián"
      >
        {messages.map((msg) => (
          <div key={msg.id}>{renderMessage(msg)}</div>
        ))}
        {isTyping && (
          <ChatBubble role="bot">
            <TypingIndicator />
          </ChatBubble>
        )}
      </div>

      {/* Compositor */}
      <div className="border-t border-slate-700/70 p-3 sm:p-4 space-y-2.5 bg-slate-900/60">
        {hasStarted && (
          <div className={cn('flex gap-2 overflow-x-auto pb-1 -mx-1 px-1', elderlyMode && 'max-sm:hidden')}>
            {ENTRY_OPTIONS.map((o) => (
              <button
                key={o.mode}
                type="button"
                disabled={isTyping}
                onClick={() => handleEntry(o.mode)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                  o.mode === 'SOS'
                    ? 'bg-red-600/15 border-red-500/50 text-red-300 hover:bg-red-600/25'
                    : 'bg-slate-800 border-slate-600 text-slate-200 hover:text-white hover:border-brand-400'
                }`}
              >
                <o.icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {o.label}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isTyping) handleAnalyze(inputText);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Mensaje sospechoso
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={2}
            maxLength={MAX_LENGTH}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pegá acá el mensaje, SMS o enlace sospechoso…"
            className="flex-1 resize-none p-3 bg-slate-950/70 border border-slate-700 rounded-2xl text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition"
          />
          <Button
            type="submit"
            size="icon"
            icon={Send}
            disabled={isTyping || inputText.trim().length < MIN_LENGTH}
            aria-label="Analizar mensaje"
          />
        </form>
        <p className={cn('text-[11px] text-slate-500 flex items-center gap-1', elderlyMode && 'max-sm:hidden')}>
          <ShieldAlert className="w-3 h-3" />
          Esto es una ayuda, no un veredicto. Ante la duda, no actúes.
        </p>
      </div>
    </div>
  );
}
