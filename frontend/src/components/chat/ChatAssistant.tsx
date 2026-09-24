import { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Send, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse } from '../../types';

interface ChatAssistantProps {
  onReportIncident?: (title: string, entity: string, vector: string, text: string) => void;
  onOpenSos?: () => void;
}

export function ChatAssistant({ onReportIncident, onOpenSos }: ChatAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ChatAnalysisResponse | null>(null);

  const quickChips = [
    {
      label: '🚨 Me llamaron de un banco pidiendo claves',
      text: 'Me llamaron supuestamente de Banco Formosa diciendo que bloquearon mi cuenta y que tengo que ir al cajero o dictarles el código token de la app.',
    },
    {
      label: '🔗 Me llegó un link de un premio o paquete',
      text: '¡URGENTE! Fuiste seleccionado para cobrar el bono extraordinario de $70.000. Confirmá tus datos antes de las 24 hs en: bit.ly/bono-acreditacion',
    },
    {
      label: '💬 Me piden un código por WhatsApp',
      text: 'Hola má, cambié de número porque se rompió mi teléfono. ¿Me pasás el código de 6 dígitos que te acaba de llegar por SMS?',
    },
  ];

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim()) {
      toast.error('Por favor escribe o pega el mensaje sospechoso.');
      return;
    }

    setLoading(true);
    try {
      const res = await chatApi.analyzeMessage(text);
      setAnalysis(res);
      if (res.risk_level === 'HIGH') {
        toast.error('¡Alerta de alto riesgo! No compartas claves ni transfieras dinero.');
      } else if (res.risk_level === 'MEDIUM') {
        toast.warning('Precaución detectada. Te recomendamos verificar por canales oficiales.');
      } else {
        toast.success('El mensaje no presenta indicios evidentes de manipulación.');
      }
    } catch {
      // Manejado por interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChipClick = (text: string) => {
    setInputText(text);
    handleAnalyze(text);
  };

  const handleShareWhatsApp = () => {
    if (!analysis) return;
    const url = `https://wa.me/?text=${encodeURIComponent(analysis.wa_share_text)}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp para consultar con tu contacto de confianza.');
  };

  const handleSendToRadar = () => {
    if (!analysis || !onReportIncident) return;
    onReportIncident(
      `Sospecha de estafa: ${analysis.detected_entity || 'Entidad no identificada'}`,
      analysis.detected_entity || 'Otro',
      analysis.detected_vector || 'WHATSAPP',
      inputText
    );
    toast.success('Mensaje cargado en el formulario de reporte del Radar Comunitario.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tarjeta Principal de Consulta */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Asistente de Contención Inmediata
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              ¿Dudas de un mensaje, llamada o enlace?
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Pegá el texto recibido para identificar trampas de urgencia, falsas autoridades y links fraudulentos en segundos.
            </p>
          </div>

          {onOpenSos && (
            <button
              onClick={onOpenSos}
              className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/20 transition-all shrink-0 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              Llamada de Emergencia SOS
            </button>
          )}
        </div>

        {/* Chips de Acción Rápida */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Casos frecuentes de consulta inmediata:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickChipClick(chip.text)}
                className="text-xs px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/80 hover:bg-slate-800/60 transition-all text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Área de Entrada de Mensaje */}
        <div className="relative mt-2">
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pegá aquí el mensaje de WhatsApp, SMS o describe lo que te dijeron por teléfono..."
            className="w-full p-4 pb-14 bg-slate-950/90 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setAnalysis(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analizar Mensaje
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado del Análisis / Semáforo Visual */}
      {analysis && (
        <div className={`rounded-3xl border p-6 sm:p-8 transition-all shadow-2xl backdrop-blur-md ${
          analysis.risk_level === 'HIGH'
            ? 'bg-red-950/20 border-red-800/80 shadow-red-900/10'
            : analysis.risk_level === 'MEDIUM'
            ? 'bg-amber-950/20 border-amber-800/80 shadow-amber-900/10'
            : 'bg-emerald-950/20 border-emerald-800/80 shadow-emerald-900/10'
        }`}>
          {/* Cabecera del Semáforo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                analysis.risk_level === 'HIGH'
                  ? 'bg-red-600 text-white shadow-red-600/30'
                  : analysis.risk_level === 'MEDIUM'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              }`}>
                {analysis.risk_level === 'HIGH' ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : analysis.risk_level === 'MEDIUM' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                    analysis.risk_level === 'HIGH'
                      ? 'bg-red-900/60 text-red-300 border border-red-700'
                      : analysis.risk_level === 'MEDIUM'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  }`}>
                    Riesgo {analysis.risk_level === 'HIGH' ? 'Alto' : analysis.risk_level === 'MEDIUM' ? 'Medio' : 'Bajo'}
                  </span>
                  {analysis.detected_entity && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Suplanta a: <strong>{analysis.detected_entity}</strong>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Probabilidad de Engaño: {analysis.risk_percentage}%
                </h3>
              </div>
            </div>

            {/* Barra de Progreso del Semáforo */}
            <div className="w-full sm:w-48 bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  analysis.risk_level === 'HIGH'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                    : analysis.risk_level === 'MEDIUM'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                }`}
                style={{ width: `${analysis.risk_percentage}%` }}
              />
            </div>
          </div>

          {/* Diagnóstico en Lenguaje Claro */}
          <div className="py-5">
            <p className="text-base text-slate-200 font-medium leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Cajas de Acción Inmediata y Advertencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Qué deberías hacer ahora:
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-normal">
                {analysis.immediate_action}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1.5">
                <XCircle className="w-4 h-4" />
                Qué NUNCA debés hacer:
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-normal">
                {analysis.what_not_to_do}
              </p>
            </div>
          </div>

          {/* Resaltado de Frases Manipulativas */}
          {analysis.highlighted_phrases.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                Trampas Psicológicas Detectadas en el Texto:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.highlighted_phrases.map((h, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                        "{h.phrase}"
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {h.category}
                      </span>
                    </div>
                    <p className="text-slate-400 pt-1 leading-relaxed">
                      {h.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción: WhatsApp y Reporte */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <button
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Consultar con un Familiar por WhatsApp (wa.me)
            </button>

            {onReportIncident && analysis.risk_level !== 'LOW' && (
              <button
                onClick={handleSendToRadar}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Advertir a la Comunidad en el Radar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
