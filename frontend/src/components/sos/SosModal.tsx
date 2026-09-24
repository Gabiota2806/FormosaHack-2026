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
import { EmergencyCallsPanel } from './EmergencyCallsPanel';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-modal-title"
        aria-describedby="sos-modal-desc"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-clip rounded-3xl bg-slate-900 border border-red-900/60 p-6 sm:p-8 shadow-2xl text-slate-100"
      >
        {/* Botón Cerrar */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar protocolo SOS"
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6 pr-10">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10">
            <AlertOctagon className="w-6 h-6 motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <h3 id="sos-modal-title" className="text-xl font-bold text-white tracking-tight">
              Protocolo de Auxilio y Contención SOS
            </h3>
            <p id="sos-modal-desc" className="text-xs text-slate-400">
              Actuá con rapidez para congelar transacciones y resguardar tu evidencia.
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div
          role="tablist"
          aria-label="Secciones del protocolo SOS"
          className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6"
        >
          <button
            type="button"
            role="tab"
            id="sos-tab-emergency"
            aria-selected={activeTab === 'emergency'}
            aria-controls="sos-panel-emergency"
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emergency'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
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
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'report_card'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
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
            <p className="text-xs text-slate-400">
              Completá los datos conocidos para generar una ficha estructurada. Esta ficha sirve como evidencia formal ante la Policía Informática o tu banco.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Entidad Suplantada
                </label>
                <input
                  type="text"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="Ej: Banco Formosa, REFSA, MP"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Monto Aproximado ($)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 45000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  CBU/CVU o Alias Destino
                </label>
                <input
                  type="text"
                  value={fakeCbu}
                  onChange={(e) => setFakeCbu(e.target.value)}
                  placeholder="Ej: 00000031... o juan.perez.mp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Teléfono del Estafador
                </label>
                <input
                  type="text"
                  value={fakePhone}
                  onChange={(e) => setFakePhone(e.target.value)}
                  placeholder="Ej: +54 9 370 4..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Link o Sitio Fraudulento (si hubo)
              </label>
              <input
                type="text"
                value={fakeLink}
                onChange={(e) => setFakeLink(e.target.value)}
                placeholder="Ej: https://bancoformosa-gestion.online"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Breve Relato de lo Ocurrido
              </label>
              <textarea
                rows={3}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Contanos brevemente qué te dijeron o cómo fue la maniobra..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleCopyReportCard}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Ficha de Denuncia
              </button>
              <button
                onClick={handleDownloadReportCard}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Archivo (.txt)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
