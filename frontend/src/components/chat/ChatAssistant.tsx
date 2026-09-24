import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse } from '../../types';
import { ChatBubble } from './ChatBubble';
import { ContentionCard } from './ContentionCard';
import { RiskAnalysisCard } from './RiskAnalysisCard';
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

interface ChatAssistantProps {
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
  onOpenSos?: () => void;
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

export function ChatAssistant({ onReportIncident, onOpenSos }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const nextId = useRef(1);
  const pendingTimers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timers = pendingTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const pushMessages = (...newMessages: NewChatMessage[]) => {
    setMessages((prev) => [
      ...prev,
      ...newMessages.map((m) => ({ ...m, id: nextId.current++ }) as ChatMessage),
    ]);
  };

  const replyAfterDelay = (replies: NewChatMessage[], onDone?: () => void) => {
    setIsTyping(true);
    const timer = window.setTimeout(() => {
      setIsTyping(false);
      pushMessages(...replies);
      onDone?.();
    }, SCRIPTED_REPLY_DELAY_MS);
    pendingTimers.current.push(timer);
  };

  const handleEntry = (mode: EntryMode) => {
    const option = ENTRY_OPTIONS.find((o) => o.mode === mode)!;
    pushMessages({ role: 'user', text: option.userText });

    switch (mode) {
      case 'PREVENCION':
        replyAfterDelay(
          [{ role: 'bot', kind: 'text', text: PREVENTION_TEXT, quickReplies: EXAMPLE_MESSAGES }],
          () => inputRef.current?.focus(),
        );
        break;
      case 'DURANTE':
        replyAfterDelay([
          { role: 'bot', kind: 'contention' },
          { role: 'bot', kind: 'text', text: AFTER_CONTENTION_TEXT },
        ]);
        break;
      case 'SOS':
        replyAfterDelay([{ role: 'bot', kind: 'text', text: SOS_TEXT }], onOpenSos);
        break;
    }
  };

  const handleAnalyze = async (rawText: string) => {
    const text = rawText.trim();
    if (text.length < MIN_LENGTH) {
      toast.error('Escribí o pegá el mensaje sospechoso para poder analizarlo.');
      return;
    }

    pushMessages({ role: 'user', text });
    setInputText('');
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
  };

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.type === 'entry') handleEntry(reply.mode);
    else handleAnalyze(reply.text);
  };

  const handleShareWhatsApp = (analysis: ChatAnalysisResponse) => {
    const url = `https://wa.me/?text=${encodeURIComponent(analysis.wa_share_text)}`;
    window.open(url, '_blank', 'noopener');
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
                    className="text-left text-sm px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-slate-200 hover:text-white hover:border-blue-500/80 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2.5"
                  >
                    <reply.icon
                      className={`w-4 h-4 shrink-0 ${reply.type === 'entry' && reply.mode === 'SOS' ? 'text-red-400' : 'text-cyan-400'}`}
                      aria-hidden="true"
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
          <ChatBubble role="bot" wide>
            <RiskAnalysisCard
              analysis={msg.analysis}
              onShareWhatsApp={() => handleShareWhatsApp(msg.analysis)}
              onReport={onReportIncident ? () => handleReport(msg.analysis, msg.sourceText) : undefined}
            />
          </ChatBubble>
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
    <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-md flex flex-col h-[calc(100vh-10rem)] min-h-[480px] overflow-hidden">
      {/* Cabecera del chat */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white leading-tight">Asistente CiberGuardián</h2>
          <p className="text-xs text-slate-400">Sin registro · No guardamos tus mensajes</p>
        </div>
        {hasStarted && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nueva consulta
          </button>
        )}
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
      <div className="border-t border-slate-800 p-3 sm:p-4 space-y-2.5 bg-slate-950/40">
        {hasStarted && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {ENTRY_OPTIONS.map((o) => (
              <button
                key={o.mode}
                type="button"
                disabled={isTyping}
                onClick={() => handleEntry(o.mode)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                  o.mode === 'SOS'
                    ? 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/60'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-blue-500/80'
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
            className="flex-1 resize-none p-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isTyping || inputText.trim().length < MIN_LENGTH}
            aria-label="Analizar mensaje"
            className="h-12 w-12 shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Esto es una ayuda, no un veredicto. Ante la duda, no actúes.
        </p>
      </div>
    </div>
  );
}
