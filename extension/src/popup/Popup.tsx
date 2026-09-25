import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  RotateCw,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { RiskCard } from './components/RiskCard.js';
import {
  apiClient,
  getLatestAnalysisFromStorage,
  saveAnalysisToStorage,
  updateBadgeForRisk,
  DEFAULT_STORAGE_KEY,
} from '../services/api-client.js';
import { validateAnalysisInput } from '../utils/validation.js';
import type { AnalysisStorageItem } from '../types/extension.js';

export const Popup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyzingManual, setAnalyzingManual] = useState(false);
  const [latestItem, setLatestItem] = useState<AnalysisStorageItem | null>(null);
  const [manualText, setManualText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const loadLatest = async () => {
    setLoading(true);
    try {
      const item = await getLatestAnalysisFromStorage(DEFAULT_STORAGE_KEY);
      setLatestItem(item);
      if (!item) {
        setShowManualForm(true);
      }
    } catch {
      setLatestItem(null);
      setShowManualForm(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest();

    // Escuchar cambios automáticos en el almacenamiento local si el background worker termina
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes[DEFAULT_STORAGE_KEY]) {
          const newItem = changes[DEFAULT_STORAGE_KEY].newValue as AnalysisStorageItem;
          setLatestItem(newItem);
          if (newItem?.status === 'analyzed') {
            setShowManualForm(false);
          }
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const handleManualAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAnalysisInput(manualText);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Texto inválido para análisis');
      return;
    }
    setValidationError(null);
    setAnalyzingManual(true);

    const timestamp = Date.now();
    const itemId = `cbg-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
    const pendingItem: AnalysisStorageItem = {
      id: itemId,
      text: validation.sanitizedText!,
      timestamp,
      status: 'pending',
      charCount: validation.charCount,
    };

    try {
      await updateBadgeForRisk('pending');
      const analysis = await apiClient.analyzeMessage(validation.sanitizedText!);

      if (analysis.success && analysis.data) {
        pendingItem.status = 'analyzed';
        pendingItem.result = analysis.data;
        pendingItem.isOffline = analysis.isOfflineFallback ?? false;
        await updateBadgeForRisk(analysis.data.risk_level);
      } else {
        pendingItem.status = 'error';
        pendingItem.errorMessage = analysis.error || 'Error al analizar el contenido';
        await updateBadgeForRisk('error');
      }
    } catch (err: unknown) {
      pendingItem.status = 'error';
      pendingItem.errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      await updateBadgeForRisk('error');
    } finally {
      await saveAnalysisToStorage(pendingItem);
      setLatestItem(pendingItem);
      setAnalyzingManual(false);
      setShowManualForm(false);
    }
  };

  const handleOpenWebAppDirect = () => {
    const url = 'http://localhost:8000';
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-[360px] h-[480px] bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden border border-slate-800">
      {/* Header fijo */}
      <header className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1">
              <span>Ciber</span>
              <span className="text-brand-400">Guardián</span>
            </h1>
            <span className="text-[10px] text-slate-400 block font-medium">FormosaHack 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={loadLatest}
            title="Recargar último análisis"
            aria-label="Recargar último análisis"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleOpenWebAppDirect}
            title="Abrir Webapp Principal"
            aria-label="Abrir Webapp Principal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Contenido principal scrolleable */}
      <main className="flex-1 overflow-y-auto scrollbar-subtle p-3.5 space-y-3">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" aria-hidden="true" />
            <p className="text-xs text-slate-400">Cargando estado del diagnóstico...</p>
          </div>
        ) : showManualForm ? (
          /* Formulario de análisis manual */
          <div className="space-y-3">
            {latestItem?.status === 'analyzed' && (
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold cursor-pointer mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Volver al diagnóstico anterior
              </button>
            )}

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Análisis Directo de Contenido
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Pegá un mensaje, SMS, correo o enlace para auditarlo en tiempo real con el motor de IA y reglas locales.
              </p>
            </div>

            <form onSubmit={handleManualAnalyze} className="space-y-2.5">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Ejemplo: 'Banco Formosa: Se ha suspendido tu acceso. Ingresá en https://bancoformosa-gestion.site para revalidar tu token...'"
                rows={4}
                className="w-full p-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition resize-none"
              />

              {validationError && (
                <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={analyzingManual || !manualText.trim()}
                className="w-full py-2 px-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {analyzingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" aria-hidden="true" />
                    <span>Auditando contenido...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" aria-hidden="true" />
                    <span>Analizar con CiberGuardián</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : latestItem?.status === 'pending' ? (
          /* Estado pendiente / en proceso */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" aria-hidden="true" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Análisis Heurístico en Curso
            </h2>
            <p className="text-[11px] text-slate-400">
              Evaluando patrones de urgencia, spoofing y enlaces sospechosos...
            </p>
          </div>
        ) : latestItem?.status === 'error' ? (
          /* Estado de error */
          <div className="p-4 bg-red-950/20 rounded-2xl border border-red-500/40 space-y-3 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" aria-hidden="true" />
            <h2 className="text-xs font-bold text-red-300 uppercase tracking-wider">
              Error en el Diagnóstico
            </h2>
            <p className="text-[11px] text-slate-400 leading-tight">
              {latestItem.errorMessage || 'No se pudo conectar con el servicio de análisis.'}
            </p>
            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCw className="w-3 h-3" aria-hidden="true" />
              Probar análisis manual
            </button>
          </div>
        ) : latestItem?.status === 'analyzed' && latestItem.result ? (
          /* Estado analizado exitoso */
          <div className="space-y-3">
            <RiskCard item={latestItem} />
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer transition-colors"
              >
                Analizar otro contenido manualmente
              </button>
            </div>
          </div>
        ) : (
          /* Estado vacío inicial */
          <div className="h-full flex flex-col items-center justify-center text-center p-5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <Search className="w-6 h-6 text-brand-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Sin Análisis Reciente
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Seleccioná texto en cualquier pestaña web, hacé clic derecho y elegí <strong>"Analizar con CiberGuardián"</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="py-2 px-3 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Ingresar texto manualmente
            </button>
          </div>
        )}
      </main>

      {/* Footer fijo con link al Webapp */}
      <footer className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 text-center shrink-0">
        <button
          type="button"
          onClick={handleOpenWebAppDirect}
          className="text-[10px] text-slate-400 hover:text-brand-400 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>Ir a la plataforma completa: http://localhost:8000</span>
          <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
};

export default Popup;
