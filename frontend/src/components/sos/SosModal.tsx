import { useEffect, useRef, useState } from 'react';
import {
  PhoneCall,
  FileText,
  X,
  AlertOctagon
} from 'lucide-react';
import { cn } from '../ui/cn';
import { EmergencyCallsPanel } from './EmergencyCallsPanel';
import { ReportCardForm } from './ReportCardForm';
import { EMPTY_REPORT_CARD, type ReportCardData } from './reportCard';

const TAB_CLASSES =
  'flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SosModal({ isOpen, onClose }: SosModalProps) {
  const [activeTab, setActiveTab] = useState<'emergency' | 'report_card'>('emergency');

  // Datos de la Ficha de Denuncia: viven acá para no perderse si se cierra el modal sin querer.
  const [reportData, setReportData] = useState<ReportCardData>(EMPTY_REPORT_CARD);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // onClose suele llegar como arrow inline; se guarda en un ref para no re-ejecutar el efecto en cada render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Accesibilidad: foco inicial, cierre con Escape, bloqueo de scroll y retorno del foco al disparador.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-modal-title"
        aria-describedby="sos-modal-desc"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-clip rounded-3xl bg-white text-slate-800 shadow-2xl shadow-black/40 animate-fade-up"
      >
        {/* Encabezado */}
        <div className="bg-red-600 text-white px-6 sm:px-8 py-5 flex items-center gap-3 pr-16">
          <div className="w-12 h-12 shrink-0 rounded-full bg-white/15 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <h3 id="sos-modal-title" className="text-xl font-bold tracking-tight">
              Protocolo de Auxilio y Contención SOS
            </h3>
            <p id="sos-modal-desc" className="text-xs text-red-50">
              Actuá con rapidez para congelar transacciones y resguardar tu evidencia.
            </p>
          </div>
        </div>

        {/* Botón Cerrar */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar protocolo SOS"
          className="absolute right-4 top-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Selector de Pestañas */}
          <div
            role="tablist"
            aria-label="Secciones del protocolo SOS"
            className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-6"
          >
            <button
              type="button"
              role="tab"
              id="sos-tab-emergency"
              aria-selected={activeTab === 'emergency'}
              aria-controls="sos-panel-emergency"
              onClick={() => setActiveTab('emergency')}
              className={cn(
                TAB_CLASSES,
                activeTab === 'emergency' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
              1. Llamadas 1-Tap a Bancos
            </button>
            <button
              type="button"
              role="tab"
              id="sos-tab-report-card"
              aria-selected={activeTab === 'report_card'}
              aria-controls="sos-panel-report-card"
              onClick={() => setActiveTab('report_card')}
              className={cn(
                TAB_CLASSES,
                activeTab === 'report_card'
                  ? 'bg-brand-500 text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              2. Ficha de Denuncia Digital
            </button>
          </div>

          {/* Pestaña 1: Llamadas de Urgencia 1-Tap */}
          {activeTab === 'emergency' && (
            <div role="tabpanel" id="sos-panel-emergency" aria-labelledby="sos-tab-emergency">
              <EmergencyCallsPanel />
            </div>
          )}

          {/* Pestaña 2: Ficha de Denuncia Digital */}
          {activeTab === 'report_card' && (
            <div
              role="tabpanel"
              id="sos-panel-report-card"
              aria-labelledby="sos-tab-report-card"
            >
              <ReportCardForm data={reportData} onChange={setReportData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
