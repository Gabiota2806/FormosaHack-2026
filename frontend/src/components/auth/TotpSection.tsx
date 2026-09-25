import { useState } from 'react';
import { ShieldCheck, ShieldAlert, QrCode, KeyRound, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface TotpSectionProps {
  onSuccess?: () => void;
  className?: string;
}

export function TotpSection({ onSuccess, className = '' }: TotpSectionProps) {
  const { totpStatus, setup2FA, verify2FA } = useAuth();
  const [verifyCode, setVerifyCode] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStartSetup = async () => {
    setIsSettingUp(true);
    await setup2FA();
  };

  const handleCopySecret = async () => {
    if (!totpStatus.secret) return;
    try {
      await navigator.clipboard.writeText(totpStatus.secret);
      toast.success('Clave secreta copiada al portapapeles');
    } catch {
      toast.info(`Clave secreta: ${totpStatus.secret}`);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      toast.error('Por favor ingresá el código de 6 dígitos.');
      return;
    }
    setIsVerifying(true);
    try {
      const ok = await verify2FA(verifyCode.trim());
      if (ok) {
        setVerifyCode('');
        setIsSettingUp(false);
        onSuccess?.();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`space-y-5 text-slate-100 ${className}`}>
      {/* Estado actual de 2FA */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              totpStatus.enabled
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {totpStatus.enabled ? (
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Segundo Factor de Autenticación (2FA TOTP)</h4>
            <p className="text-xs text-slate-400">
              {totpStatus.enabled
                ? 'Tu cuenta está protegida con verificación en dos pasos.'
                : 'Protegé tu cuenta requiriendo un código dinámico de 6 dígitos.'}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
            totpStatus.enabled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          {totpStatus.enabled ? '2FA Activo' : '2FA Inactivo'}
        </span>
      </div>

      {/* Flujo de configuración y enrolamiento */}
      {!totpStatus.qrCode ? (
        <div className="pt-1">
          <Button
            type="button"
            icon={QrCode}
            onClick={handleStartSetup}
            disabled={isSettingUp}
            className="w-full sm:w-auto"
          >
            {totpStatus.enabled ? 'Reconfigurar Segundo Factor' : 'Configurar Segundo Factor (2FA)'}
          </Button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-brand-400 font-semibold text-sm">
            <QrCode className="w-4 h-4" aria-hidden="true" />
            <span>Escaneá el código QR</span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Abrí Google Authenticator, Authy u otra app TOTP compatible en tu teléfono y escaneá este código:
          </p>

          <div className="inline-block p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
            <img
              src={totpStatus.qrCode}
              alt="Código QR para enrolamiento 2FA"
              className="w-48 h-48 mx-auto"
            />
          </div>

          {totpStatus.secret && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 block">¿No podés escanear el QR? Ingresá esta clave manualmente:</span>
              <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                <code className="text-xs font-mono text-brand-300 tracking-wider select-all">{totpStatus.secret}</code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                  title="Copiar clave secreta"
                  aria-label="Copiar clave secreta"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="max-w-xs mx-auto space-y-3 pt-2">
            <label htmlFor="totp-verify-input" className="block text-xs font-semibold text-slate-300 text-left">
              Código de verificación (6 dígitos):
            </label>
            <div className="flex gap-2">
              <input
                id="totp-verify-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                aria-label="Código de verificación 2FA"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                required
                className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-lg text-white tracking-widest placeholder-slate-600 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
              <Button type="submit" icon={KeyRound} disabled={isVerifying || verifyCode.length < 6}>
                Verificar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
