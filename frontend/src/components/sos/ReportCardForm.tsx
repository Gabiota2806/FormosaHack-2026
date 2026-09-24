import { useState, type FormEvent } from 'react';
import { Copy, Download, FileCheck2, PencilLine, Printer, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../ui/cn';
import {
  CHANNEL_LABELS,
  NARRATIVE_MAX_LENGTH,
  buildReportCardText,
  generateReferenceCode,
  reportCardFileName,
  validateReportCard,
  type ReportCardData,
  type ReportCardErrors,
  type ReportChannel,
} from './reportCard';

interface ReportCardFormProps {
  data: ReportCardData;
  onChange: (data: ReportCardData) => void;
}

interface GeneratedCard {
  referenceCode: string;
  text: string;
}

// Orden en que se enfoca el primer campo con error.
const FIELD_ORDER: (keyof ReportCardData)[] = [
  'channel',
  'incidentDate',
  'entity',
  'amount',
  'destination',
  'scammerPhone',
  'fraudLink',
  'narrative',
];

const fieldId = (field: keyof ReportCardData) => `report-card-${field}`;

const inputClass = (hasError: boolean) =>
  cn(
    'w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
    hasError ? 'border-red-500 bg-red-50/20' : 'border-slate-200',
  );

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function ReportCardForm({ data, onChange }: ReportCardFormProps) {
  const [errors, setErrors] = useState<ReportCardErrors>({});
  const [generated, setGenerated] = useState<GeneratedCard | null>(null);

  const update = <K extends keyof ReportCardData>(field: K, value: ReportCardData[K]) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateReportCard(data);
    setErrors(validation);

    const firstInvalid = FIELD_ORDER.find((field) => validation[field]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      toast.error('Revisá los campos marcados en rojo para generar la ficha.');
      return;
    }

    const issuedAt = new Date();
    const referenceCode = generateReferenceCode(issuedAt);
    setGenerated({ referenceCode, text: buildReportCardText(data, { referenceCode, issuedAt }) });
    toast.success(`Ficha ${referenceCode} generada. Podés copiarla, descargarla o imprimirla.`);
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.text);
      toast.success('Ficha copiada al portapapeles. Ya podés pegarla en un documento o mensaje.');
    } catch {
      toast.error('No pudimos copiar la ficha. Probá descargarla como archivo.');
    }
  };

  const handleDownload = () => {
    if (!generated) return;
    // BOM para que los acentos se vean bien al abrirlo en el Bloc de notas de Windows.
    const blob = new Blob(['﻿', generated.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportCardFileName(generated.referenceCode);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.success('Ficha descargada en formato de texto.');
  };

  const handlePrint = () => {
    if (!generated) return;
    // Iframe oculto: imprime solo la ficha, sin el resto de la app.
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      iframe.remove();
      toast.error('No pudimos abrir la impresión. Probá descargar la ficha.');
      return;
    }
    doc.open();
    doc.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${generated.referenceCode}</title>` +
        '<style>body{font:12pt/1.5 monospace;margin:2cm;white-space:pre-wrap;word-break:break-word}</style>' +
        `</head><body>${escapeHtml(generated.text)}</body></html>`,
    );
    doc.close();
    win.addEventListener('afterprint', () => iframe.remove());
    win.focus();
    win.print();
  };

  if (generated) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl" role="status">
          <FileCheck2 className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>
            Ficha generada con el código <strong className="font-mono">{generated.referenceCode}</strong>.
            Guardala y citala en cada trámite.
          </span>
        </div>

        <Card>
          <pre
            aria-label={`Vista previa de la ficha ${generated.referenceCode}`}
            tabIndex={0}
            className="max-h-72 overflow-auto p-4 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {generated.text}
          </pre>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border-t border-slate-200 bg-slate-50">
            <Button icon={Copy} onClick={handleCopy}>
              Copiar Ficha de Denuncia
            </Button>
            <Button variant="secondary" icon={Download} onClick={handleDownload}>
              Descargar (.txt)
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Imprimir
            </Button>
          </div>
        </Card>

        <Button variant="ghost" size="sm" icon={PencilLine} onClick={() => setGenerated(null)}>
          Corregir datos
        </Button>
      </div>
    );
  }

  const fieldProps = (field: keyof ReportCardData) => ({
    id: fieldId(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${fieldId(field)}-error` : undefined,
    className: inputClass(Boolean(errors[field])),
  });

  const label = (field: keyof ReportCardData, text: string, required = false) => (
    <label htmlFor={fieldId(field)} className="block text-xs font-semibold text-slate-700 mb-1">
      {text}
      {required && (
        <span className="text-red-500" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  );

  const error = (field: keyof ReportCardData) =>
    errors[field] && (
      <p id={`${fieldId(field)}-error`} className="mt-1 text-xs text-red-500">
        {errors[field]}
      </p>
    );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-xs text-slate-600">
        Completá los datos conocidos para generar una ficha estructurada. Esta ficha sirve como evidencia formal
        ante la Policía Informática o tu banco. Solo el canal es obligatorio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          {label('channel', '¿Por dónde te contactaron?', true)}
          <select
            {...fieldProps('channel')}
            aria-required="true"
            value={data.channel}
            onChange={(e) => update('channel', e.target.value as ReportChannel | '')}
          >
            <option value="">Elegí una opción</option>
            {(Object.keys(CHANNEL_LABELS) as ReportChannel[]).map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
          {error('channel')}
        </div>

        <div>
          {label('incidentDate', 'Fecha y hora del hecho')}
          <input
            {...fieldProps('incidentDate')}
            type="datetime-local"
            value={data.incidentDate}
            onChange={(e) => update('incidentDate', e.target.value)}
            className={inputClass(Boolean(errors.incidentDate))}
          />
          {error('incidentDate')}
        </div>

        <div>
          {label('entity', 'Entidad suplantada')}
          <input
            {...fieldProps('entity')}
            type="text"
            value={data.entity}
            onChange={(e) => update('entity', e.target.value)}
            placeholder="Ej: Banco Formosa, REFSA, MP"
          />
          {error('entity')}
        </div>

        <div>
          {label('amount', 'Monto aproximado ($)')}
          <input
            {...fieldProps('amount')}
            type="text"
            inputMode="decimal"
            value={data.amount}
            onChange={(e) => update('amount', e.target.value)}
            placeholder="Ej: 45.000"
          />
          {error('amount')}
        </div>

        <div>
          {label('destination', 'CBU/CVU o alias de destino')}
          <input
            {...fieldProps('destination')}
            type="text"
            autoCapitalize="off"
            spellCheck={false}
            value={data.destination}
            onChange={(e) => update('destination', e.target.value)}
            placeholder="Ej: 00000031... o juan.perez.mp"
          />
          {error('destination')}
        </div>

        <div>
          {label('scammerPhone', 'Teléfono del estafador')}
          <input
            {...fieldProps('scammerPhone')}
            type="tel"
            value={data.scammerPhone}
            onChange={(e) => update('scammerPhone', e.target.value)}
            placeholder="Ej: +54 9 370 4..."
          />
          {error('scammerPhone')}
        </div>
      </div>

      <div>
        {label('fraudLink', 'Link o sitio fraudulento (si hubo)')}
        <input
          {...fieldProps('fraudLink')}
          type="text"
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          value={data.fraudLink}
          onChange={(e) => update('fraudLink', e.target.value)}
          placeholder="Ej: https://bancoformosa-gestion.online"
        />
        {error('fraudLink')}
      </div>

      <div>
        {label('narrative', 'Breve relato de lo ocurrido')}
        <textarea
          {...fieldProps('narrative')}
          rows={3}
          maxLength={NARRATIVE_MAX_LENGTH}
          value={data.narrative}
          onChange={(e) => update('narrative', e.target.value)}
          placeholder="Contanos brevemente qué te dijeron o cómo fue la maniobra..."
        />
        {error('narrative')}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
        Tus datos no se envían a ningún servidor: la ficha se genera solo en tu dispositivo.
      </p>

      <Button type="submit" icon={FileCheck2} className="w-full">
        Generar Ficha de Denuncia
      </Button>
    </form>
  );
}
