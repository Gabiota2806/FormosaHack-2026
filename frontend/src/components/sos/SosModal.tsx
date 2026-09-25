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
        // Columna flexible: el diálogo no scrollea (overflow-hidden recorta todo dentro de las
        // esquinas de 24px); solo scrollea el cuerpo, y el encabezado queda siempre visible.
        // dvh y no vh: en el celular, vh no descuenta la barra del navegador.
        className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden rounded-3xl bg-white text-slate-800 shadow-2xl shadow-black/40 animate-fade-up"
      >
        {/* Encabezado fijo: título y botón de cerrar siempre a mano */}
        <div
          data-testid="sos-modal-header"
          className="shrink-0 bg-red-600 text-white pl-6 sm:pl-8 pr-3 sm:pr-4 py-3 sm:py-5 flex items-center gap-3"
        >
          {/* En celular el encabezado va compacto: con el Modo Abuelo (letra de 22px), el ícono y la
              bajada lo estiraban tanto que al cuerpo con scroll le quedaba una franja mínima. */}
          <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-white/15 items-center justify-center">
            <AlertOctagon className="w-6 h-6 motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="sos-modal-title" className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
              Protocolo de Auxilio y Contención SOS
            </h3>
            <p id="sos-modal-desc" className="max-sm:sr-only text-xs text-red-50">
              Actuá con rapidez para congelar transacciones y resguardar tu evidencia.
            </p>
          </div>

          {/* Dentro del encabezado (antes, posicionado encima del contenido que scrolleaba) */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar protocolo SOS"
            className="shrink-0 self-start w-11 h-11 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo: único contenedor con scroll. min-h-0 permite que el flex item se achique
            por debajo de su contenido; overscroll-contain evita arrastrar la página de atrás. */}
        <div data-testid="sos-modal-body" className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-subtle p-6 sm:p-8">
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
