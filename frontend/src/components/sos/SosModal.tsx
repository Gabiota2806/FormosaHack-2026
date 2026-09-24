import { useState } from 'react';
import { 
  PhoneCall, 
  FileText, 
  Copy, 
  Download, 
  X, 
  AlertOctagon, 
  Lock,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

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

  if (!isOpen) return null;

  const emergencyContacts = [
    {
      name: 'Banco Formosa (Bloqueo 24hs)',
      phone: '0800-777-2262',
      tel: 'tel:08007772262',
      desc: 'Bloqueo inmediato de Home Banking y tarjetas de débito.',
      highlight: true,
    },
    {
      name: 'Tarjeta Chigüé',
      phone: '0810-888-2444',
      tel: 'tel:08108882444',
      desc: 'Denuncia por pérdida, robo o transacciones no autorizadas.',
      highlight: false,
    },
    {
      name: 'Red Link (Central de Bloqueos)',
      phone: '0800-888-5465',
      tel: 'tel:08008885465',
      desc: 'Atención 24 hs para inmovilización de tarjetas Link.',
      highlight: false,
    },
    {
      name: 'Banelco',
      phone: '011-4320-5000',
      tel: 'tel:01143205000',
      desc: 'Línea de emergencia para clientes de la red Banelco.',
      highlight: false,
    },
    {
      name: 'Policía de Formosa (Delitos Informáticos)',
      phone: '911 / 3704-430795',
      tel: 'tel:911',
      desc: 'Denuncias penales por estafas electrónicas y hackeos.',
      highlight: true,
    },
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-red-900/60 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Protocolo de Auxilio y Contención SOS
            </h3>
            <p className="text-xs text-slate-400">
              Actuá con rapidez para congelar transacciones y resguardar tu evidencia.
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emergency'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            1. Llamadas 1-Tap a Bancos
          </button>
          <button
            onClick={() => setActiveTab('report_card')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'report_card'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            2. Ficha de Denuncia Digital
          </button>
        </div>

        {/* Pestaña 1: Llamadas de Urgencia 1-Tap */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-red-300">
                <Lock className="w-4 h-4" /> Regla de Oro en Vivo:
              </span>
              <p>
                Si estás al teléfono con alguien que te pide ir al cajero, dictar un token o abrir una app: 
                <strong> ¡CORTÁ LA LLAMADA INMEDIATAMENTE!</strong> Ninguna entidad oficial hace eso.
              </p>
            </div>

            <div className="space-y-3">
              {emergencyContacts.map((c, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    c.highlight
                      ? 'bg-red-950/20 border-red-800/80 hover:border-red-600'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                    <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                      {c.phone}
                    </span>
                  </div>

                  <a
                    href={c.tel}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all shrink-0 ${
                      c.highlight
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Llamar 1-Tap
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pestaña 2: Ficha de Denuncia Digital */}
        {activeTab === 'report_card' && (
          <div className="space-y-4">
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
