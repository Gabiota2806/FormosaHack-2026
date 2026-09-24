import { useEffect, useRef, useState } from 'react';
import {
  PhoneCall,
  FileText,
  Copy,
  Download,
  X,
  AlertOctagon
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { EmergencyCallsPanel } from './EmergencyCallsPanel';

const TAB_CLASSES =
  'flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2';
const LABEL_CLASSES = 'block text-xs font-semibold text-slate-600 mb-1';
const INPUT_CLASSES =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SosModal({ isOpen, onClose }: SosModalProps) {
  const [activeTab, setActiveTab] = useState<'emergency' | 'report_card'>('emergency');

  // Estado para la Ficha de Denuncia Digital
  const [entity, setEntity] = useState('Banco Formosa');
  const [amount, setAmount] = useState('');
  const [fakeCbu, setFakeCbu] = useState('');
  const [fakePhone, setFakePhone] = useState('');
  const [fakeLink, setFakeLink] = useState('');
  const [narrative, setNarrative] = useState('');

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

  const generateReportCardText = () => {
    const timestamp = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' });
    return `=====================================================
FICHA DE DENUNCIA DIGITAL — CIBERGUARDIÁN
Documento de recopilación preliminar para denuncia penal
=====================================================
Fecha y Hora de Emisión: ${timestamp}
Entidad o Institución Fingida: ${entity || 'No especificada'}
Monto Involucrado / Transferido: ${amount ? `$${amount}` : 'No declarado'}
CBU / CVU / Alias del Estafador: ${fakeCbu || 'No aportado'}
Teléfono del Estafador: ${fakePhone || 'No aportado'}
Enlace o Sitio Fraudulento: ${fakeLink || 'No aportado'}

RELATO DE LOS HECHOS:
${narrative || 'El usuario no proporcionó una descripción adicional.'}

RECOMENDACIONES LEGALES:
1. Presentar esta ficha ante la Comisaría más cercana o Fiscalía de Instrucción de Formosa.
2. Adjuntar capturas de pantalla completas donde se vean fechas y números de remitente.
3. Solicitar en el banco el Número de Operación (ID Coelsa) de la transferencia.
=====================================================`;
  };

  const handleCopyReportCard = () => {
    const text = generateReportCardText();
    navigator.clipboard.writeText(text);
    toast.success('Ficha copiada al portapapeles. Ya podés pegarla en un documento o mensaje.');
  };

  const handleDownloadReportCard = () => {
    const text = generateReportCardText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Denuncia_CiberGuardian_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Ficha descargada exitosamente en formato de texto.');
  };

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
              className="space-y-4"
            >
              <p className="text-sm text-slate-600">
                Completá los datos conocidos para generar una ficha estructurada. Esta ficha sirve como evidencia formal ante la Policía Informática o tu banco.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sos-entity" className={LABEL_CLASSES}>
                    Entidad Suplantada
                  </label>
                  <input
                    id="sos-entity"
                    type="text"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    placeholder="Ej: Banco Formosa, REFSA, MP"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="sos-amount" className={LABEL_CLASSES}>
                    Monto Aproximado ($)
                  </label>
                  <input
                    id="sos-amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej: 45000"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="sos-cbu" className={LABEL_CLASSES}>
                    CBU/CVU o Alias Destino
                  </label>
                  <input
                    id="sos-cbu"
                    type="text"
                    value={fakeCbu}
                    onChange={(e) => setFakeCbu(e.target.value)}
                    placeholder="Ej: 00000031... o juan.perez.mp"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label htmlFor="sos-phone" className={LABEL_CLASSES}>
                    Teléfono del Estafador
                  </label>
                  <input
                    id="sos-phone"
                    type="text"
                    value={fakePhone}
                    onChange={(e) => setFakePhone(e.target.value)}
                    placeholder="Ej: +54 9 370 4..."
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sos-link" className={LABEL_CLASSES}>
                  Link o Sitio Fraudulento (si hubo)
                </label>
                <input
                  id="sos-link"
                  type="text"
                  value={fakeLink}
                  onChange={(e) => setFakeLink(e.target.value)}
                  placeholder="Ej: https://bancoformosa-gestion.online"
                  className={INPUT_CLASSES}
                />
              </div>

              <div>
                <label htmlFor="sos-narrative" className={LABEL_CLASSES}>
                  Breve Relato de lo Ocurrido
                </label>
                <textarea
                  id="sos-narrative"
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Contanos brevemente qué te dijeron o cómo fue la maniobra..."
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button icon={Copy} onClick={handleCopyReportCard} className="flex-1">
                  Copiar Ficha de Denuncia
                </Button>
                <Button variant="secondary" icon={Download} onClick={handleDownloadReportCard} className="flex-1">
                  Descargar Archivo (.txt)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
